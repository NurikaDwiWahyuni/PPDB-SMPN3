// app/api/admin/logout/route.ts
import { NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/app/_lib/session'

export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' })
  return res
}
