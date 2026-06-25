// app/_lib/session-crypto.ts
// Kompatibel dengan Edge Runtime (proxy.ts) dan Node.js Runtime (Route Handler)

export interface AdminSession {
  id: number
  nama: string
  username: string
  role: 'superadmin' | 'operator' | 'viewer'
  sekolah_id: number
}

export const COOKIE_NAME = 'admin_session'

const SESSION_SECRET = process.env.SESSION_SECRET ?? 'fallback-dev-secret'

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Base64 encode/decode yang aman di Node.js dan Edge Runtime
function b64encode(str: string): string {
  return typeof Buffer !== 'undefined'
    ? Buffer.from(str).toString('base64')
    : btoa(unescape(encodeURIComponent(str)))
}

function b64decode(str: string): string {
  return typeof Buffer !== 'undefined'
    ? Buffer.from(str, 'base64').toString('utf-8')
    : decodeURIComponent(escape(atob(str)))
}

async function signPayload(payload: string): Promise<string> {
  const key = await getKey()
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return bufToHex(sig)
}

export async function encodeSession(data: AdminSession): Promise<string> {
  const payload = b64encode(JSON.stringify(data))
  const sig = await signPayload(payload)
  return `${payload}.${sig}`
}

export async function decodeSession(raw: string): Promise<AdminSession | null> {
  try {
    const dot = raw.lastIndexOf('.')
    if (dot === -1) return null
    const payload = raw.slice(0, dot)
    const sig = raw.slice(dot + 1)

    const expected = await signPayload(payload)
    if (expected.length !== sig.length) return null
    let diff = 0
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
    }
    if (diff !== 0) return null

    const data = JSON.parse(b64decode(payload))
    if (!data?.id || !data?.role) return null
    return data as AdminSession
  } catch {
    return null
  }
}
