// app/api/pengumuman/route.ts
// GET /api/pengumuman?q=<nisn_atau_nomor>
// Publik — cek hasil seleksi. Muncul kalau published=true ATAU tanggal_publish sudah lewat.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/_lib/db'
import type { ApiResponse, HasilSeleksi } from '@/app/_lib/types'

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<HasilSeleksi>>> {
  const q = request.nextUrl.searchParams.get('q')?.trim()

  if (!q) {
    return NextResponse.json(
      { success: false, message: 'Parameter pencarian tidak boleh kosong.' },
      { status: 400 },
    )
  }

  try {
    const sekarang = new Date()

    const hasil = await db.hasilSeleksi.findFirst({
      where: {
        OR: [
          { published: true },
          { tanggal_publish: { lte: sekarang } },
        ],
        pendaftaran: {
          OR: [
            { nomor_pendaftaran: q.toUpperCase() },
            { data_siswa: { nisn: q } },
          ],
        },
      },
      include: {
        pendaftaran: {
          include: {
            data_siswa: true,
            jalur: true,
          },
        },
      },
    })

    if (!hasil || !hasil.pendaftaran.data_siswa) {
      return NextResponse.json(
        { success: false, message: 'Data tidak ditemukan atau pengumuman belum dipublikasikan.' },
        { status: 404 },
      )
    }

    const data: HasilSeleksi = {
      nama_lengkap: hasil.pendaftaran.data_siswa.nama_lengkap,
      nisn: hasil.pendaftaran.data_siswa.nisn ?? '-',
      nomor_pendaftaran: hasil.pendaftaran.nomor_pendaftaran!,
      jalur: hasil.pendaftaran.jalur.nama_jalur as HasilSeleksi['jalur'],
      hasil: hasil.hasil as HasilSeleksi['hasil'],
      catatan: hasil.catatan,
    }

    return NextResponse.json({ success: true, message: 'Data ditemukan.', data })
  } catch (err) {
    console.error('[API /pengumuman GET]', err)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server.' },
      { status: 500 },
    )
  }
}
