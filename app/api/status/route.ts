import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/_lib/db'
import type { ApiResponse, PendaftaranDetail } from '@/app/_lib/types'

/**
 * GET /api/status?nomor=<nomor_pendaftaran>
 * Mengembalikan detail lengkap pendaftaran termasuk status tiap dokumen.
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<PendaftaranDetail>>> {
  const nomor = request.nextUrl.searchParams.get('nomor')?.trim()

  if (!nomor) {
    return NextResponse.json(
      { success: false, message: 'Nomor pendaftaran wajib diisi.' },
      { status: 400 },
    )
  }

  try {
    const pendaftaran = await db.pendaftaran.findUnique({
      where: { nomor_pendaftaran: nomor.toUpperCase() },
      include: {
        jalur: true,
        data_orangtua: true,
        data_siswa: true,
        dokumen: {
          orderBy: { uploaded_at: 'desc' },
        },
      },
    })

    if (!pendaftaran || !pendaftaran.data_orangtua || !pendaftaran.data_siswa) {
      return NextResponse.json(
        { success: false, message: 'Nomor pendaftaran tidak ditemukan.' },
        { status: 404 },
      )
    }

    const detail: PendaftaranDetail = {
      id: pendaftaran.id,
      nomor_pendaftaran: pendaftaran.nomor_pendaftaran!,
      status: pendaftaran.status as PendaftaranDetail['status'],
      catatan_admin: pendaftaran.catatan_admin,
      tanggal_daftar: pendaftaran.tanggal_daftar.toISOString(),
      jalur: {
        id: pendaftaran.jalur.id,
        nama_jalur: pendaftaran.jalur.nama_jalur as PendaftaranDetail['jalur']['nama_jalur'],
      },
      data_orangtua: {
        nama_ayah: pendaftaran.data_orangtua.nama_ayah,
        nama_ibu: pendaftaran.data_orangtua.nama_ibu,
        nomor_wa: pendaftaran.data_orangtua.nomor_wa,
        alamat: pendaftaran.data_orangtua.alamat,
      },
      data_siswa: {
        nama_lengkap: pendaftaran.data_siswa.nama_lengkap,
        nisn: pendaftaran.data_siswa.nisn ?? '',
        tempat_lahir: pendaftaran.data_siswa.tempat_lahir,
        tanggal_lahir: pendaftaran.data_siswa.tanggal_lahir.toISOString(),
        jenis_kelamin: pendaftaran.data_siswa.jenis_kelamin as 'L' | 'P',
        asal_sekolah: pendaftaran.data_siswa.asal_sekolah ?? '',
      },
      dokumen: pendaftaran.dokumen.map((d) => ({
        id: d.id,
        jenis_dokumen: d.jenis_dokumen as PendaftaranDetail['dokumen'][number]['jenis_dokumen'],
        status: d.status as PendaftaranDetail['dokumen'][number]['status'],
        catatan_admin: d.catatan_admin,
        uploaded_at: d.uploaded_at.toISOString(),
      })),
    }

    return NextResponse.json({ success: true, message: 'Data ditemukan.', data: detail })
  } catch (err) {
    console.error('[API /status GET]', err)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server.' },
      { status: 500 },
    )
  }
}
