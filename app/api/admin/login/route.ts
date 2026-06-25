import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/app/_lib/db'
import { encodeSession, COOKIE_NAME } from '@/app/_lib/session'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username dan password wajib diisi.' },
        { status: 400 }
      )
    }

    // Cari admin di database
    const admin = await db.admin.findUnique({
      where: { username: String(username) },
    })

    if (!admin || !admin.is_aktif) {
      return NextResponse.json(
        { success: false, message: 'Username atau password salah.' },
        { status: 401 }
      )
    }

    // Verifikasi password
    const valid = await bcrypt.compare(String(password), admin.password_hash)
    if (!valid) {
      return NextResponse.json(
        { success: false, message: 'Username atau password salah.' },
        { status: 401 }
      )
    }

    // Update last_login
    await db.admin.update({
      where: { id: admin.id },
      data: { last_login: new Date() },
    })

    // Encode session dengan HMAC signature
    const sessionData = await encodeSession({
      id: admin.id,
      nama: admin.nama,
      username: admin.username,
      role: admin.role,
      sekolah_id: admin.sekolah_id,
    })

    const res = NextResponse.json({ success: true })
    res.cookies.set(COOKIE_NAME, sessionData, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8, // 8 jam
    })

    return res
  } catch (err) {
    console.error('[POST /api/admin/login]', err)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server.' },
      { status: 500 }
    )
  }
}
