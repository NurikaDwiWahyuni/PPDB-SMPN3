// app/api/admin/pendaftaran/route.ts
// GET   — daftar pendaftar (dengan filter status & jalur)
// PATCH  — ubah status pendaftaran
// DELETE — hapus pendaftar (superadmin only)

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/_lib/db'
import { getSessionFromRequest } from '@/app/_lib/session'
import { kirimWA, pesanPerluPerbaikan } from '@/app/_lib/wa'

function unauth() {
  return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
}

// ── GET /api/admin/pendaftaran?status=&jalur=&q=&page= ────────────────────
export async function GET(req: NextRequest) {
  if (!await getSessionFromRequest(req)) return unauth()

  const sp = req.nextUrl.searchParams
  const status = sp.get('status') || undefined
  const jalur  = sp.get('jalur')  || undefined
  const q      = sp.get('q')?.trim() || undefined
  const page   = Math.max(1, parseInt(sp.get('page') || '1'))
  const limit  = 20

  try {
    const sesi = await getSessionFromRequest(req)
    if (!sesi) return unauth()

    const tahun = await db.tahunAjaran.findFirst({ where: { status: 'aktif' } })
    if (!tahun) return NextResponse.json({ success: true, data: { rows: [], total: 0 } })

    const where: Record<string, unknown> = { tahun_ajaran_id: tahun.id }
    if (status) where.status = status
    if (jalur)  where.jalur  = { nama_jalur: jalur }
    if (q) {
      where.OR = [
        { nomor_pendaftaran: { contains: q } },
        { data_siswa: { nama_lengkap: { contains: q } } },
        { data_siswa: { nisn: { contains: q } } },
        { data_orangtua: { nomor_wa: { contains: q } } },
      ]
    }

    const [rows, total] = await Promise.all([
      db.pendaftaran.findMany({
        where,
        include: {
          jalur: true,
          data_siswa: { select: { nama_lengkap: true, nisn: true } },
          data_orangtua: { select: { nomor_wa: true } },
        },
        orderBy: { tanggal_daftar: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.pendaftaran.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        rows: rows.map((r) => ({
          id: r.id,
          nomor_pendaftaran: r.nomor_pendaftaran,
          status: r.status,
          tanggal_daftar: r.tanggal_daftar,
          jalur: r.jalur.nama_jalur,
          nama_lengkap: r.data_siswa?.nama_lengkap ?? '-',
          nisn: r.data_siswa?.nisn ?? '-',
          nomor_wa: r.data_orangtua?.nomor_wa ?? '-',
        })),
        total,
        page,
        total_page: Math.ceil(total / limit),
        is_superadmin: sesi.role === 'superadmin',
      },
    })
  } catch (err) {
    console.error('[GET /api/admin/pendaftaran]', err)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

// ── DELETE /api/admin/pendaftaran ── superadmin only ─────────────────────
export async function DELETE(req: NextRequest) {
  const sesi = await getSessionFromRequest(req)
  if (!sesi) return unauth()
  if (sesi.role !== 'superadmin') {
    return NextResponse.json({ success: false, message: 'Hanya Super Admin yang dapat menghapus data pendaftar.' }, { status: 403 })
  }

  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ success: false, message: 'ID tidak valid.' }, { status: 400 })

    const pendaftaran = await db.pendaftaran.findUnique({ where: { id: Number(id) } })
    if (!pendaftaran) return NextResponse.json({ success: false, message: 'Data tidak ditemukan.' }, { status: 404 })

    // Hapus cascade: dokumen → hasil_seleksi → data_siswa → data_orangtua → pendaftaran
    await db.dokumenPendaftaran.deleteMany({ where: { pendaftaran_id: Number(id) } })
    await db.hasilSeleksi.deleteMany({       where: { pendaftaran_id: Number(id) } })
    await db.dataSiswa.deleteMany({          where: { pendaftaran_id: Number(id) } })
    await db.dataOrangtua.deleteMany({       where: { pendaftaran_id: Number(id) } })
    await db.pendaftaran.delete({            where: { id: Number(id) } })

    return NextResponse.json({ success: true, message: 'Data pendaftar berhasil dihapus.' })
  } catch (err) {
    console.error('[DELETE /api/admin/pendaftaran]', err)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
// Body: { id, aksi: 'verifikasi'|'perbaikan'|'tolak'|'terima', catatan?, dokumen_catatan? }
export async function PATCH(req: NextRequest) {
  const sesi = await getSessionFromRequest(req)
  if (!sesi) return unauth()
  if (sesi.role === 'viewer') {
    return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { id, aksi, catatan, dokumen_catatan } = body

    const pendaftaran = await db.pendaftaran.findUnique({
      where: { id: Number(id) },
      include: { data_orangtua: true, data_siswa: true, dokumen: true },
    })
    if (!pendaftaran) {
      return NextResponse.json({ success: false, message: 'Pendaftaran tidak ditemukan.' }, { status: 404 })
    }

    if (aksi === 'verifikasi') {
      await db.dokumenPendaftaran.updateMany({
        where: { pendaftaran_id: pendaftaran.id, status: 'menunggu' },
        data: { status: 'diterima' },
      })
      await db.pendaftaran.update({
        where: { id: pendaftaran.id },
        data: { status: 'terverifikasi', catatan_admin: catatan || null },
      })

    } else if (aksi === 'perbaikan') {
      if (dokumen_catatan && typeof dokumen_catatan === 'object') {
        for (const [jenis, ctt] of Object.entries(dokumen_catatan)) {
          const dok = await db.dokumenPendaftaran.findFirst({
            where: { pendaftaran_id: pendaftaran.id, jenis_dokumen: jenis as never },
            orderBy: { uploaded_at: 'desc' },
          })
          if (dok) {
            await db.dokumenPendaftaran.update({
              where: { id: dok.id },
              data: { status: 'perlu_revisi', catatan_admin: String(ctt) },
            })
          }
        }
      }
      await db.pendaftaran.update({
        where: { id: pendaftaran.id },
        data: { status: 'perlu_perbaikan', catatan_admin: catatan || null },
      })
      // Kirim WA hanya untuk pendaftar online
      if (
        pendaftaran.sumber_pendaftaran === 'online' &&
        pendaftaran.data_orangtua?.nomor_wa &&
        pendaftaran.nomor_pendaftaran
      ) {
        await kirimWA({
          nomor: pendaftaran.data_orangtua.nomor_wa,
          pesan: pesanPerluPerbaikan(
            pendaftaran.nomor_pendaftaran,
            pendaftaran.data_siswa?.nama_lengkap ?? '',
            catatan || null,
          ),
        })
      }

    } else if (aksi === 'tolak') {
      // Tidak kirim WA
      await db.pendaftaran.update({
        where: { id: pendaftaran.id },
        data: { status: 'tidak_diterima', catatan_admin: catatan || null },
      })

    } else if (aksi === 'terima') {
      // Tidak kirim WA
      await db.pendaftaran.update({
        where: { id: pendaftaran.id },
        data: { status: 'diterima', catatan_admin: catatan || null },
      })
      await db.hasilSeleksi.upsert({
        where: { pendaftaran_id: pendaftaran.id },
        update: { hasil: 'diterima', catatan: catatan || null },
        create: { pendaftaran_id: pendaftaran.id, hasil: 'diterima', catatan: catatan || null },
      })
      await db.jalurPendaftaran.update({
        where: { id: pendaftaran.jalur_id },
        data: { kuota_terpakai: { increment: 1 } },
      })

    } else {
      return NextResponse.json({ success: false, message: 'Aksi tidak dikenal.' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Berhasil diperbarui.' })
  } catch (err) {
    console.error('[PATCH /api/admin/pendaftaran]', err)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
