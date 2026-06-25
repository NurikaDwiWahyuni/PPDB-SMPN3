// app/api/admin/dokumen/route.ts
// GET /api/admin/dokumen?id=<dokumen_id>
// Redirect ke signed URL Supabase Storage untuk admin yang sudah login

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/_lib/db'
import { getSessionFromRequest } from '@/app/_lib/session'
import { getFileUrl } from '@/app/_lib/storage'

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

    const signedUrl = await getFileUrl(dok.path_file)

    // Redirect ke signed URL Supabase Storage (berlaku 1 jam)
    return NextResponse.redirect(signedUrl)
  } catch (err) {
    console.error('[GET /api/admin/dokumen]', err)
    return NextResponse.json({ success: false, message: 'File tidak dapat dibuka.' }, { status: 500 })
  }
}
