// app/api/admin/pendaftaran/[id]/route.ts
// GET — detail lengkap satu pendaftaran (data siswa, ortu, dokumen)

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/_lib/db'
import { getSessionFromRequest } from '@/app/_lib/session'

function unauth() {
  return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await getSessionFromRequest(req)) return unauth()

  const { id } = await params
  const pendId = parseInt(id)
  if (isNaN(pendId)) {
    return NextResponse.json({ success: false, message: 'ID tidak valid.' }, { status: 400 })
  }

  try {
    const data = await db.pendaftaran.findUnique({
      where: { id: pendId },
      include: {
        jalur: true,
        data_siswa: true,
        data_orangtua: true,
        dokumen: {
          orderBy: { uploaded_at: 'desc' },
        },
      },
    })

    if (!data) {
      return NextResponse.json({ success: false, message: 'Tidak ditemukan.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[GET /api/admin/pendaftaran/[id]]', err)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
