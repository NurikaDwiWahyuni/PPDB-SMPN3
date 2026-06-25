import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/_lib/db'
import { simpanFile, validasiFileServer } from '@/app/_lib/storage'
import type { ApiResponse } from '@/app/_lib/types'

interface DokumenPerlu {
  id: number
  jenis_dokumen: string
  catatan_admin: string | null
}

interface DataPerbaikan {
  nomor_pendaftaran: string
  nama_siswa: string
  catatan_admin: string | null
  dokumen_perlu_revisi: DokumenPerlu[]
}

/**
 * GET /api/perbaikan?nomor=<nomor_pendaftaran>
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<DataPerbaikan>>> {
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
        data_siswa: true,
        dokumen: {
          where: { status: 'perlu_revisi' },
          orderBy: { uploaded_at: 'desc' },
          distinct: ['jenis_dokumen'],
        },
      },
    })

    if (!pendaftaran || !pendaftaran.data_siswa) {
      return NextResponse.json(
        { success: false, message: 'Nomor pendaftaran tidak ditemukan.' },
        { status: 404 },
      )
    }

    if (pendaftaran.status !== 'perlu_perbaikan') {
      return NextResponse.json(
        { success: false, message: 'Pendaftaran ini tidak memerlukan perbaikan dokumen.' },
        { status: 400 },
      )
    }

    const data: DataPerbaikan = {
      nomor_pendaftaran: pendaftaran.nomor_pendaftaran!,
      nama_siswa: pendaftaran.data_siswa.nama_lengkap,
      catatan_admin: pendaftaran.catatan_admin,
      dokumen_perlu_revisi: pendaftaran.dokumen.map((d) => ({
        id: d.id,
        jenis_dokumen: d.jenis_dokumen,
        catatan_admin: d.catatan_admin,
      })),
    }

    return NextResponse.json({ success: true, message: 'Data ditemukan.', data })
  } catch (err) {
    console.error('[API /perbaikan GET]', err)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server.' },
      { status: 500 },
    )
  }
}

/**
 * POST /api/perbaikan
 * Orang tua upload ulang dokumen yang diminta revisi.
 * Tidak ada notifikasi WA setelah selesai perbaikan.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const fd = await request.formData()
    const nomor = (fd.get('nomor_pendaftaran') as string)?.trim()

    if (!nomor) {
      return NextResponse.json(
        { success: false, message: 'Nomor pendaftaran wajib diisi.' },
        { status: 400 },
      )
    }

    const pendaftaran = await db.pendaftaran.findUnique({
      where: { nomor_pendaftaran: nomor.toUpperCase() },
      include: {
        data_siswa: true,
        dokumen: {
          where: { status: 'perlu_revisi' },
          distinct: ['jenis_dokumen'],
          orderBy: { uploaded_at: 'desc' },
        },
      },
    })

    if (!pendaftaran || !pendaftaran.data_siswa) {
      return NextResponse.json(
        { success: false, message: 'Nomor pendaftaran tidak ditemukan.' },
        { status: 404 },
      )
    }

    if (pendaftaran.status !== 'perlu_perbaikan') {
      return NextResponse.json(
        { success: false, message: 'Pendaftaran ini tidak dalam status perlu perbaikan.' },
        { status: 400 },
      )
    }

    const dokumenPerluRevisi = pendaftaran.dokumen
    if (dokumenPerluRevisi.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada dokumen yang perlu diperbaiki.' },
        { status: 400 },
      )
    }

    for (const dok of dokumenPerluRevisi) {
      const file = fd.get(dok.jenis_dokumen) as File | null
      if (!file) {
        return NextResponse.json(
          { success: false, message: `File ${dok.jenis_dokumen} belum diupload.` },
          { status: 400 },
        )
      }
      const err = validasiFileServer(file)
      if (err) {
        return NextResponse.json(
          { success: false, message: `${dok.jenis_dokumen}: ${err}` },
          { status: 400 },
        )
      }
    }

    const timestamp = Date.now()
    for (const dok of dokumenPerluRevisi) {
      const file = fd.get(dok.jenis_dokumen) as File
      const filePath = await simpanFile(
        file,
        pendaftaran.nomor_pendaftaran!,
        `${dok.jenis_dokumen}_rev_${timestamp}`,
      )

      await db.dokumenPendaftaran.create({
        data: {
          pendaftaran_id: pendaftaran.id,
          jenis_dokumen: dok.jenis_dokumen,
          path_file: filePath,
          file_size: file.size,
          mime_type: file.type,
          status: 'menunggu',
        },
      })
    }

    await db.pendaftaran.update({
      where: { id: pendaftaran.id },
      data: {
        status: 'menunggu_verifikasi',
        catatan_admin: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Perbaikan dokumen berhasil dikirim. Admin akan memverifikasi ulang.',
      data: null,
    })
  } catch (err) {
    console.error('[API /perbaikan POST]', err)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server.' },
      { status: 500 },
    )
  }
}
