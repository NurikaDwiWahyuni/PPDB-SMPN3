import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/_lib/db'
import { simpanFile, hapusFile, validasiFileServer } from '@/app/_lib/storage'
import { kirimWA, pesanNomorPendaftaran } from '@/app/_lib/wa'
import type { ApiResponse } from '@/app/_lib/types'

const JENIS_DOKUMEN = ['akta', 'skl', 'kk', 'ktp_ayah', 'ktp_ibu'] as const

/**
 * POST /api/pendaftaran
 * Alur 1 dari skema: submit formulir pendaftaran online
 * Body: FormData { jalur, data_orangtua, data_siswa, akta, skl, kk, ktp_ayah, ktp_ibu }
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<{ nomor_pendaftaran: string }>>> {
  try {
    const fd = await request.formData()

    // ── 1. Ambil & validasi field teks ─────────────────────────────────────
    const jalurNama = (fd.get('jalur') as string)?.trim()
    const dataOrtuRaw = fd.get('data_orangtua') as string
    const dataSiswaRaw = fd.get('data_siswa') as string

    if (!jalurNama || !dataOrtuRaw || !dataSiswaRaw) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap.' },
        { status: 400 },
      )
    }

    const dataOrtu = JSON.parse(dataOrtuRaw)
    const dataSiswa = JSON.parse(dataSiswaRaw)

    if (!dataOrtu.nomor_wa) {
      return NextResponse.json(
        { success: false, message: 'Nomor WhatsApp wajib diisi.' },
        { status: 400 },
      )
    }

    // ── 2. Validasi file dokumen ────────────────────────────────────────────
    for (const jenis of JENIS_DOKUMEN) {
      const file = fd.get(jenis) as File | null
      if (!file) {
        return NextResponse.json(
          { success: false, message: `Dokumen ${jenis} wajib diupload.` },
          { status: 400 },
        )
      }
      const err = validasiFileServer(file)
      if (err) {
        return NextResponse.json(
          { success: false, message: `${jenis}: ${err}` },
          { status: 400 },
        )
      }
    }

    // ── 3. Ambil tahun ajaran aktif ─────────────────────────────────────────
    const tahunAjaran = await db.tahunAjaran.findFirst({
      where: { status: 'aktif' },
    })
    if (!tahunAjaran) {
      return NextResponse.json(
        { success: false, message: 'Pendaftaran belum dibuka.' },
        { status: 400 },
      )
    }

    // ── 4. Ambil jalur yang sesuai ──────────────────────────────────────────
    const jalur = await db.jalurPendaftaran.findFirst({
      where: { nama_jalur: jalurNama as never, tahun_ajaran_id: tahunAjaran.id, is_aktif: true },
    })
    if (!jalur) {
      return NextResponse.json(
        { success: false, message: 'Jalur pendaftaran tidak tersedia.' },
        { status: 400 },
      )
    }

    // ── 5. Cek duplikat NISN (constraint uq_nisn_per_tahun) ────────────────
    if (dataSiswa.nisn) {
      const existing = await db.dataSiswa.findFirst({
        where: { nisn: dataSiswa.nisn, tahun_ajaran_id: tahunAjaran.id },
      })
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            message: 'NISN sudah terdaftar untuk tahun ajaran ini. Satu siswa hanya bisa mendaftar sekali.',
          },
          { status: 409 },
        )
      }
    }

    // ── 6. Simpan ke DB dalam transaksi ─────────────────────────────────────
    const pendaftaran = await db.pendaftaran.create({
      data: {
        tahun_ajaran_id: tahunAjaran.id,
        jalur_id: jalur.id,
        sumber_pendaftaran: 'online',
        status: 'menunggu_verifikasi',
        data_orangtua: {
          create: {
            nama_ayah: dataOrtu.nama_ayah,
            nama_ibu: dataOrtu.nama_ibu,
            nomor_wa: dataOrtu.nomor_wa,
            alamat: dataOrtu.alamat,
          },
        },
        data_siswa: {
          create: {
            nisn: dataSiswa.nisn || null,
            tahun_ajaran_id: tahunAjaran.id,
            nomor_kk: dataSiswa.nomor_kk,
            nama_lengkap: dataSiswa.nama_lengkap,
            tempat_lahir: dataSiswa.tempat_lahir,
            tanggal_lahir: new Date(dataSiswa.tanggal_lahir),
            jenis_kelamin: dataSiswa.jenis_kelamin,
            agama: dataSiswa.agama,
            asal_sekolah: dataSiswa.asal_sekolah || null,
          },
        },
      },
    })

    // ── 7. Generate & simpan nomor pendaftaran ──────────────────────────────
    const tahun = new Date().getFullYear()
    const nomor = `PPDB-${tahun}-${String(pendaftaran.id).padStart(5, '0')}`
    await db.pendaftaran.update({
      where: { id: pendaftaran.id },
      data: { nomor_pendaftaran: nomor },
    })

    // ── 8. Simpan file dokumen ke disk & DB ─────────────────────────────────
    const savedPaths: string[] = []
    try {
      for (const jenis of JENIS_DOKUMEN) {
        const file = fd.get(jenis) as File
        const filePath = await simpanFile(file, nomor, jenis)
        savedPaths.push(filePath)

        await db.dokumenPendaftaran.create({
          data: {
            pendaftaran_id: pendaftaran.id,
            jenis_dokumen: jenis as never,
            path_file: filePath,
            file_size: file.size,
            mime_type: file.type,
            status: 'menunggu',
          },
        })
      }
    } catch (fileErr) {
      // Rollback: hapus file yang sudah tersimpan
      await Promise.all(savedPaths.map(hapusFile))
      throw fileErr
    }

    // ── 9. Kirim notifikasi WhatsApp ────────────────────────────────────────
    await kirimWA({
      nomor: dataOrtu.nomor_wa,
      pesan: pesanNomorPendaftaran(nomor, dataSiswa.nama_lengkap),
    })

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran berhasil. Nomor pendaftaran telah dikirim ke WhatsApp.',
      data: { nomor_pendaftaran: nomor },
    })
  } catch (err) {
    console.error('[API /pendaftaran POST]', err)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server.' },
      { status: 500 },
    )
  }
}
