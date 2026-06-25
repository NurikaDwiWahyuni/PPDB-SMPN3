// app/api/admin/akun/route.ts
// GET  — daftar akun admin
// POST — buat akun baru
// PATCH — edit akun (nama, role, password, is_aktif)
// DELETE — hapus akun

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/app/_lib/db'
import { getSessionFromRequest } from '@/app/_lib/session'

function unauth() {
  return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
}
function forbidden() {
  return NextResponse.json({ success: false, message: 'Hanya superadmin yang dapat mengelola akun.' }, { status: 403 })
}

// ── GET ───────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const sesi = await getSessionFromRequest(req)
  if (!sesi) return unauth()

  try {
    const akun = await db.admin.findMany({
      where: { sekolah_id: sesi.sekolah_id },
      select: {
        id: true, nama: true, username: true,
        role: true, is_aktif: true, last_login: true, created_at: true,
      },
      orderBy: { created_at: 'asc' },
    })
    return NextResponse.json({ success: true, data: akun, is_superadmin: sesi.role === 'superadmin' })
  } catch (err) {
    console.error('[GET /api/admin/akun]', err)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

// ── POST — buat akun baru ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const sesi = await getSessionFromRequest(req)
  if (!sesi) return unauth()
  if (sesi.role !== 'superadmin') return forbidden()

  try {
    const { nama, username, password, role } = await req.json()

    if (!nama || !username || !password || !role) {
      return NextResponse.json({ success: false, message: 'Semua field wajib diisi.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, message: 'Password minimal 6 karakter.' }, { status: 400 })
    }

    const sudahAda = await db.admin.findUnique({ where: { username } })
    if (sudahAda) {
      return NextResponse.json({ success: false, message: 'Username sudah digunakan.' }, { status: 409 })
    }

    const hash = await bcrypt.hash(password, 12)
    const akun = await db.admin.create({
      data: { sekolah_id: sesi.sekolah_id, nama, username, password_hash: hash, role },
      select: { id: true, nama: true, username: true, role: true, is_aktif: true, created_at: true },
    })

    return NextResponse.json({ success: true, message: 'Akun berhasil dibuat.', data: akun })
  } catch (err) {
    console.error('[POST /api/admin/akun]', err)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

// ── PATCH — edit akun ─────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const sesi = await getSessionFromRequest(req)
  if (!sesi) return unauth()

  try {
    const { id, nama, role, password, is_aktif } = await req.json()

    // Hanya superadmin yang bisa ubah role & is_aktif orang lain
    // Operator/viewer hanya bisa ubah nama & password diri sendiri
    const targetId = Number(id)
    const isSelf = sesi.id === targetId

    if (!isSelf && sesi.role !== 'superadmin') return forbidden()

    const data: Record<string, unknown> = {}
    if (nama) data.nama = nama
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ success: false, message: 'Password minimal 6 karakter.' }, { status: 400 })
      }
      data.password_hash = await bcrypt.hash(password, 12)
    }
    if (sesi.role === 'superadmin') {
      if (role) data.role = role
      if (is_aktif !== undefined) data.is_aktif = is_aktif
    }

    await db.admin.update({ where: { id: targetId }, data })
    return NextResponse.json({ success: true, message: 'Akun berhasil diperbarui.' })
  } catch (err) {
    console.error('[PATCH /api/admin/akun]', err)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

// ── DELETE — hapus akun ───────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const sesi = await getSessionFromRequest(req)
  if (!sesi) return unauth()
  if (sesi.role !== 'superadmin') return forbidden()

  try {
    const { id } = await req.json()
    if (Number(id) === sesi.id) {
      return NextResponse.json({ success: false, message: 'Tidak bisa menghapus akun sendiri.' }, { status: 400 })
    }
    await db.admin.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true, message: 'Akun berhasil dihapus.' })
  } catch (err) {
    console.error('[DELETE /api/admin/akun]', err)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
