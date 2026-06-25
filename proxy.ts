// proxy.ts — Next.js 16+ (menggantikan middleware.ts)
// Edge Runtime — jangan import dari _lib/session.ts, pakai session-crypto langsung

import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, COOKIE_NAME } from '@/app/_lib/session-crypto'

const PROTECTED_PREFIX = '/admin'
const PUBLIC_ADMIN_PATHS = ['/admin-login']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!pathname.startsWith(PROTECTED_PREFIX) && !pathname.startsWith('/admin-login')) {
    return NextResponse.next()
  }

  if (PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    const raw = req.cookies.get(COOKIE_NAME)?.value
    if (raw) {
      const sesi = await decodeSession(raw)
      if (sesi) {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      }
    }
    return NextResponse.next()
  }

  const raw = req.cookies.get(COOKIE_NAME)?.value
  if (!raw) {
    const loginUrl = new URL('/admin-login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const sesi = await decodeSession(raw)
  if (!sesi) {
    const loginUrl = new URL('/admin-login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    const res = NextResponse.redirect(loginUrl)
    res.cookies.delete(COOKIE_NAME)
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/admin-login'],
}
