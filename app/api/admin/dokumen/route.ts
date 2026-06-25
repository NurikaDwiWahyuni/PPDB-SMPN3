// app/api/admin/dokumen/route.ts
// GET /api/admin/dokumen?id=<dokumen_id>
// Serve file dokumen ke admin yang sudah login

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/_lib/db'
import { getSessionFromRequest } from '@/app/_lib/session'
import path from 'path'
import fs from 'fs/promises'

export async function GET(req: NextRequest) {
  if (!await getSessionFromRequest(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const id = parseInt(req.nextUrl.searchParams.get('id') ?? '')
  if (isNaN(id)) {
    return NextResponse.json({ success: false, message: 'ID tidak valid.' }, { status: 400 })
  }

  try {
    const dok = await db.dokumenPendaftaran.findUnique({ where: { id } })
    if (!dok) {
      return NextResponse.json({ success: false, message: 'Dokumen tidak ditemukan.' }, { status: 404 })
    }

    const absPath = path.join(process.cwd(), dok.path_file)
    const buffer  = await fs.readFile(absPath)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': dok.mime_type,
        'Content-Disposition': `inline; filename="${path.basename(dok.path_file)}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    console.error('[GET /api/admin/dokumen]', err)
    return NextResponse.json({ success: false, message: 'File tidak dapat dibuka.' }, { status: 500 })
  }
}
