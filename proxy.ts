// proxy.ts
import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, encodeSession, COOKIE_NAME } from '@/app/_lib/session-crypto'

const LOGIN_PATH = '/admin-login'
const MAX_AGE    = 60 * 60 * 1 // 1 jam

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!pathname.startsWith('/admin') || pathname.startsWith('/admin-login')) {
    return NextResponse.next()
  }

  const raw     = req.cookies.get(COOKIE_NAME)?.value
  const session = raw ? await decodeSession(raw) : null

  if (!session) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = LOGIN_PATH
    loginUrl.searchParams.set('callbackUrl', pathname)
    const res = NextResponse.redirect(loginUrl)
    if (raw) res.cookies.delete(COOKIE_NAME)
    return res
  }

  // Sliding session — refresh cookie tiap request supaya tidak expire saat masih aktif
  const res = NextResponse.next()
  const refreshed = await encodeSession(session)
  res.cookies.set(COOKIE_NAME, refreshed, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE,
  })
  return res
}

export const config = {
  matcher: ['/admin/:path*'],
}
