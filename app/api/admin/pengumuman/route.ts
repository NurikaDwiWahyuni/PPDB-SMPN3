// app/api/admin/pengumuman/route.ts
// GET  — ringkasan status pengumuman + jadwal publish
// POST — set tanggal_publish atau publish sekarang

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/_lib/db'
import { getSessionFromRequest } from '@/app/_lib/session'

function unauth() {
  return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
}

// ── GET ────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!await getSessionFromRequest(req)) return unauth()

  try {
    const tahun = await db.tahunAjaran.findFirst({ where: { status: 'aktif' } })
    if (!tahun) return NextResponse.json({ success: true, data: null })

    const [total, diterima, tidakDiterima, sudahPublished, jadwalPublish] = await Promise.all([
      db.hasilSeleksi.count({ where: { pendaftaran: { tahun_ajaran_id: tahun.id } } }),
      db.hasilSeleksi.count({ where: { hasil: 'diterima', pendaftaran: { tahun_ajaran_id: tahun.id } } }),
      db.hasilSeleksi.count({ where: { hasil: 'tidak_diterima', pendaftaran: { tahun_ajaran_id: tahun.id } } }),
      db.hasilSeleksi.count({ where: { published: true, pendaftaran: { tahun_ajaran_id: tahun.id } } }),
      // Ambil tanggal_publish dari satu record (semua harusnya sama kalau di-set sekaligus)
      db.hasilSeleksi.findFirst({
        where: { pendaftaran: { tahun_ajaran_id: tahun.id }, tanggal_publish: { not: null } },
        select: { tanggal_publish: true },
        orderBy: { tanggal_publish: 'asc' },
      }),
    ])

    // Hitung yang belum punya hasil seleksi (belum diterima/tolak)
    const totalPendaftar = await db.pendaftaran.count({ where: { tahun_ajaran_id: tahun.id } })

    return NextResponse.json({
      success: true,
      data: {
        tahun_ajaran: tahun.nama,
        total_pendaftar: totalPendaftar,
        total_hasil: total,
        diterima,
        tidak_diterima: tidakDiterima,
        sudah_published: sudahPublished,
        belum_published: total - sudahPublished,
        tanggal_publish: jadwalPublish?.tanggal_publish ?? null,
      },
    })
  } catch (err) {
    console.error('[GET /api/admin/pengumuman]', err)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

// ── POST ───────────────────────────────────────────────────────────────────
// Body: { aksi: 'jadwalkan', tanggal: '2026-07-07T08:00' }
//     | { aksi: 'publish_sekarang' }
//     | { aksi: 'batal_jadwal' }
//     | { aksi: 'unpublish' }
export async function POST(req: NextRequest) {
  const sesi = await getSessionFromRequest(req)
  if (!sesi) return unauth()
  if (sesi.role === 'viewer') {
    return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { aksi, tanggal } = body

    const tahun = await db.tahunAjaran.findFirst({ where: { status: 'aktif' } })
    if (!tahun) return NextResponse.json({ success: false, message: 'Tidak ada tahun ajaran aktif.' }, { status: 400 })

    if (aksi === 'publish_sekarang') {
      // Set published=true semua hasil seleksi tahun ini
      await db.hasilSeleksi.updateMany({
        where: { pendaftaran: { tahun_ajaran_id: tahun.id } },
        data: { published: true, tanggal_publish: new Date() },
      })
      return NextResponse.json({ success: true, message: 'Pengumuman berhasil dipublikasikan.' })

    } else if (aksi === 'unpublish') {
      // Tarik kembali semua publikasi
      await db.hasilSeleksi.updateMany({
        where: { pendaftaran: { tahun_ajaran_id: tahun.id } },
        data: { published: false, tanggal_publish: null },
      })
      return NextResponse.json({ success: true, message: 'Pengumuman berhasil ditarik (unpublish).' })

    } else if (aksi === 'jadwalkan') {
      if (!tanggal) return NextResponse.json({ success: false, message: 'Tanggal wajib diisi.' }, { status: 400 })
      const tgl = new Date(tanggal)
      if (isNaN(tgl.getTime())) return NextResponse.json({ success: false, message: 'Format tanggal tidak valid.' }, { status: 400 })

      await db.hasilSeleksi.updateMany({
        where: { pendaftaran: { tahun_ajaran_id: tahun.id } },
        data: { tanggal_publish: tgl },
      })
      return NextResponse.json({ success: true, message: 'Jadwal pengumuman berhasil disimpan.' })

    } else if (aksi === 'batal_jadwal') {
      await db.hasilSeleksi.updateMany({
        where: { pendaftaran: { tahun_ajaran_id: tahun.id }, published: false },
        data: { tanggal_publish: null },
      })
      return NextResponse.json({ success: true, message: 'Jadwal pengumuman dibatalkan.' })

    } else {
      return NextResponse.json({ success: false, message: 'Aksi tidak dikenal.' }, { status: 400 })
    }
  } catch (err) {
    console.error('[POST /api/admin/pengumuman]', err)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
