// app/api/admin/pendaftaran/offline/route.ts
// POST — tambah pendaftar offline oleh admin

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/_lib/db'
import { getSessionFromRequest } from '@/app/_lib/session'

function unauth() {
  return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
}

function nomorUrut(n: number) {
  return String(n).padStart(5, '0')
}

export async function POST(req: NextRequest) {
  const sesi = await getSessionFromRequest(req)
  if (!sesi) return unauth()
  if (sesi.role === 'viewer') {
    return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const {
      jalur,
      // data siswa
      nama_lengkap, nisn, nomor_kk, tempat_lahir, tanggal_lahir,
      jenis_kelamin, agama, asal_sekolah,
      // data ortu
      nama_ayah, nama_ibu, nomor_wa, alamat,
      // hasil (opsional — bisa langsung set diterima/tidak untuk offline)
      hasil, catatan_hasil,
    } = body

    // Validasi wajib
    if (!jalur || !nama_lengkap || !nomor_kk || !tempat_lahir || !tanggal_lahir || !jenis_kelamin || !agama || !nama_ayah || !nama_ibu || !nomor_wa || !alamat) {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap.' }, { status: 400 })
    }

    const tahun = await db.tahunAjaran.findFirst({ where: { status: 'aktif' } })
    if (!tahun) return NextResponse.json({ success: false, message: 'Tidak ada tahun ajaran aktif.' }, { status: 400 })

    const jalurData = await db.jalurPendaftaran.findFirst({
      where: { tahun_ajaran_id: tahun.id, nama_jalur: jalur, is_aktif: true },
    })
    if (!jalurData) return NextResponse.json({ success: false, message: 'Jalur tidak ditemukan.' }, { status: 400 })

    // Cek NISN duplikat kalau diisi
    if (nisn) {
      const dupNisn = await db.dataSiswa.findFirst({
        where: { nisn, tahun_ajaran_id: tahun.id },
      })
      if (dupNisn) return NextResponse.json({ success: false, message: 'NISN sudah terdaftar di tahun ajaran ini.' }, { status: 400 })
    }

    // Generate nomor pendaftaran
    const count = await db.pendaftaran.count({ where: { tahun_ajaran_id: tahun.id } })
    const tahunStr = tahun.nama.split('/')[0] ?? new Date().getFullYear().toString()
    const nomorPendaftaran = `PPDB-${tahunStr}-${nomorUrut(count + 1)}`

    const statusAwal = hasil ? (hasil === 'diterima' ? 'diterima' : 'tidak_diterima') : 'terverifikasi'

    // Buat semua data dalam satu transaksi
    const pendaftaran = await db.$transaction(async (tx) => {
      const pend = await tx.pendaftaran.create({
        data: {
          tahun_ajaran_id: tahun.id,
          jalur_id: jalurData.id,
          nomor_pendaftaran: nomorPendaftaran,
          sumber_pendaftaran: 'offline',
          status: statusAwal,
        },
      })

      await tx.dataSiswa.create({
        data: {
          pendaftaran_id: pend.id,
          tahun_ajaran_id: tahun.id,
          nama_lengkap,
          nisn: nisn || null,
          nomor_kk,
          tempat_lahir,
          tanggal_lahir: new Date(tanggal_lahir),
          jenis_kelamin,
          agama,
          asal_sekolah: asal_sekolah || null,
        },
      })

      await tx.dataOrangtua.create({
        data: {
          pendaftaran_id: pend.id,
          nama_ayah,
          nama_ibu,
          nomor_wa,
          alamat,
        },
      })

      // Kalau langsung ada hasil, buat juga HasilSeleksi
      if (hasil) {
        await tx.hasilSeleksi.create({
          data: {
            pendaftaran_id: pend.id,
            hasil: hasil === 'diterima' ? 'diterima' : 'tidak_diterima',
            catatan: catatan_hasil || null,
            published: false,
          },
        })
        if (hasil === 'diterima') {
          await tx.jalurPendaftaran.update({
            where: { id: jalurData.id },
            data: { kuota_terpakai: { increment: 1 } },
          })
        }
      }

      return pend
    })

    return NextResponse.json({
      success: true,
      message: `Pendaftar offline berhasil ditambahkan. Nomor: ${nomorPendaftaran}`,
      data: { nomor_pendaftaran: nomorPendaftaran, id: pendaftaran.id },
    })
  } catch (err) {
    console.error('[POST /api/admin/pendaftaran/offline]', err)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
