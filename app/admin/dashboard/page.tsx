'use client'

import { useEffect, useState } from 'react'
import { LABEL_JALUR } from '@/app/_lib/utils'
import type { NamaJalur } from '@/app/_lib/types'

interface StatData {
  tahun_ajaran: string
  total: number
  menunggu: number
  perlu_perbaikan: number
  terverifikasi: number
  diterima: number
  tidak_diterima: number
  jalur: { nama_jalur: NamaJalur; kuota: number; kuota_terpakai: number }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<StatData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then((j) => { setData(j.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-brand-azure/15 rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-brand-azure/15 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center text-slate-500">
        <p>Tidak ada tahun ajaran aktif.</p>
      </div>
    )
  }

  const statUtama = [
    { label: 'Total Pendaftar',     nilai: data.total,           warna: 'bg-brand-navy text-white' },
    { label: 'Menunggu Verifikasi', nilai: data.menunggu,        warna: 'bg-yellow-50 text-yellow-800 border border-yellow-200' },
    { label: 'Perlu Perbaikan',     nilai: data.perlu_perbaikan, warna: 'bg-orange-50 text-orange-800 border border-orange-200' },
    { label: 'Terverifikasi',       nilai: data.terverifikasi,   warna: 'bg-brand-sky/25 text-brand-navy border border-brand-azure/40' },
    { label: 'Diterima',            nilai: data.diterima,        warna: 'bg-green-50 text-green-800 border border-green-200' },
    { label: 'Tidak Diterima',      nilai: data.tidak_diterima,  warna: 'bg-red-50 text-red-800 border border-red-200' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-brand-navy">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Tahun Ajaran {data.tahun_ajaran}</p>
      </div>

      {/* Statistik utama */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-8">
        {statUtama.map((s) => (
          <div key={s.label} className={`rounded-xl p-4 sm:p-5 ${s.warna}`}>
            <p className="text-2xl sm:text-3xl font-bold">{s.nilai}</p>
            <p className="text-xs sm:text-sm mt-1 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Kuota per jalur */}
      <div className="bg-white rounded-xl border border-brand-azure/15 p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-brand-navy mb-4">Kuota per Jalur</h2>
        <div className="space-y-4">
          {data.jalur.map((j) => {
            const pct = j.kuota > 0 ? Math.round((j.kuota_terpakai / j.kuota) * 100) : 0
            return (
              <div key={j.nama_jalur}>
                <div className="flex justify-between text-sm mb-1.5 gap-2">
                  <span className="font-medium text-brand-navy">{LABEL_JALUR[j.nama_jalur]}</span>
                  <span className="text-slate-500 flex-shrink-0">{j.kuota_terpakai} / {j.kuota} siswa</span>
                </div>
                <div className="h-2 bg-brand-cream rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-navy rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">{pct}% terisi</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
