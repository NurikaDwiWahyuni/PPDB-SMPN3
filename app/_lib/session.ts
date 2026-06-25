// app/_lib/session.ts
// Server Component & Route Handler only (Node.js runtime)
// Middleware JANGAN import dari sini — pakai session-crypto.ts langsung

import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { decodeSession, COOKIE_NAME } from './session-crypto'

export type { AdminSession } from './session-crypto'
export { encodeSession, decodeSession, COOKIE_NAME } from './session-crypto'

/** Untuk Server Component */
export async function getSession() {
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get(COOKIE_NAME)?.value
    if (!raw) return null
    return await decodeSession(raw)
  } catch {
    return null
  }
}

/** Untuk Route Handler */
export async function getSessionFromRequest(req: NextRequest) {
  try {
    const raw = req.cookies.get(COOKIE_NAME)?.value
    if (!raw) return null
    return await decodeSession(raw)
  } catch {
    return null
  }
}
