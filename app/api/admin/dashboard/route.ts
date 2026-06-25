// app/api/admin/dashboard/route.ts
// GET — statistik ringkas untuk dashboard

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/_lib/db'
import { getSessionFromRequest } from '@/app/_lib/session'

export async function GET(req: NextRequest) {
  if (!await getSessionFromRequest(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const tahun = await db.tahunAjaran.findFirst({ where: { status: 'aktif' } })
    if (!tahun) {
      return NextResponse.json({ success: true, data: null })
    }

    const [total, menunggu, perluPerbaikan, terverifikasi, diterima, tidakDiterima, jalur] =
      await Promise.all([
        db.pendaftaran.count({ where: { tahun_ajaran_id: tahun.id } }),
        db.pendaftaran.count({ where: { tahun_ajaran_id: tahun.id, status: 'menunggu_verifikasi' } }),
        db.pendaftaran.count({ where: { tahun_ajaran_id: tahun.id, status: 'perlu_perbaikan' } }),
        db.pendaftaran.count({ where: { tahun_ajaran_id: tahun.id, status: 'terverifikasi' } }),
        db.pendaftaran.count({ where: { tahun_ajaran_id: tahun.id, status: 'diterima' } }),
        db.pendaftaran.count({ where: { tahun_ajaran_id: tahun.id, status: 'tidak_diterima' } }),
        db.jalurPendaftaran.findMany({ where: { tahun_ajaran_id: tahun.id } }),
      ])

    return NextResponse.json({
      success: true,
      data: {
        tahun_ajaran: tahun.nama,
        total,
        menunggu,
        perlu_perbaikan: perluPerbaikan,
        terverifikasi,
        diterima,
        tidak_diterima: tidakDiterima,
        jalur: jalur.map((j) => ({
          nama_jalur: j.nama_jalur,
          kuota: j.kuota,
          kuota_terpakai: j.kuota_terpakai,
        })),
      },
    })
  } catch (err) {
    console.error('[GET /api/admin/dashboard]', err)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
