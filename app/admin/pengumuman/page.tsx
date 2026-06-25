'use client'

import { useEffect, useState } from 'react'
import { formatTanggalWaktu } from '@/app/_lib/utils'

interface RingkasanPengumuman {
  tahun_ajaran: string
  total_pendaftar: number
  total_hasil: number
  diterima: number
  tidak_diterima: number
  sudah_published: number
  belum_published: number
  tanggal_publish: string | null
}

export default function PengumumanPage() {
  const [data, setData]       = useState<RingkasanPengumuman | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState<{ teks: string; ok: boolean } | null>(null)

  const [tglInput, setTglInput] = useState('')

  function load() {
    setLoading(true)
    fetch('/api/admin/pengumuman')
      .then(r => r.json())
      .then(j => { setData(j.data ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function kirimAksi(body: object) {
    setSaving(true)
    setMsg(null)
    const res  = await fetch('/api/admin/pengumuman', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    const json = await res.json()
    setSaving(false)
    setMsg({ teks: json.message, ok: json.success })
    if (json.success) load()
  }

  function publishSekarang() {
    if (!confirm('Yakin ingin mempublikasikan pengumuman sekarang? Semua hasil seleksi akan langsung terlihat oleh peserta.')) return
    kirimAksi({ aksi: 'publish_sekarang' })
  }

  function jadwalkan() {
    if (!tglInput) { setMsg({ teks: 'Pilih tanggal dan waktu terlebih dahulu.', ok: false }); return }
    const tgl = new Date(tglInput)
    if (tgl <= new Date()) { setMsg({ teks: 'Jadwal harus di waktu mendatang.', ok: false }); return }
    kirimAksi({ aksi: 'jadwalkan', tanggal: tglInput })
  }

  function batalJadwal() {
    if (!confirm('Batalkan jadwal pengumuman?')) return
    kirimAksi({ aksi: 'batal_jadwal' })
  }

  function unpublish() {
    if (!confirm('Yakin ingin menarik pengumuman? Peserta tidak akan bisa melihat hasil seleksi lagi sampai dipublikasikan ulang.')) return
    kirimAksi({ aksi: 'unpublish' })
  }

  const sudahPublished = (data?.sudah_published ?? 0) > 0

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl">

        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold text-brand-navy">Pengumuman Hasil Seleksi</h1>
          <p className="text-sm text-slate-500 mt-1">Atur kapan hasil seleksi dipublikasikan ke peserta.</p>
        </div>

        {/* Notif */}
        {msg && (
          <div className={`mb-6 flex items-start gap-3 rounded-xl px-4 py-3 border ${
            msg.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${msg.ok ? 'text-green-500' : 'text-red-500'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {msg.ok
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              }
            </svg>
            <p className={`text-sm ${msg.ok ? 'text-green-800' : 'text-red-700'}`}>{msg.teks}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-brand-azure/15 p-8 text-center text-slate-400 text-sm">
            Memuat data...
          </div>
        ) : !data ? (
          <div className="bg-white rounded-2xl border border-brand-azure/15 p-8 text-center text-slate-400 text-sm">
            Tidak ada tahun ajaran aktif.
          </div>
        ) : (
          <div className="space-y-5">

            {/* Ringkasan statistik */}
            <div className="bg-white rounded-2xl border border-brand-azure/15 p-5 sm:p-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Tahun Ajaran {data.tahun_ajaran}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatBox label="Total Pendaftar"   value={data.total_pendaftar} color="navy" />
                <StatBox label="Sudah Ada Hasil"   value={data.total_hasil}     color="blue" />
                <StatBox label="Diterima"          value={data.diterima}        color="green" />
                <StatBox label="Tidak Diterima"    value={data.tidak_diterima}  color="red" />
                <StatBox label="Sudah Dipublikasi" value={data.sudah_published} color="green" />
                <StatBox label="Belum Dipublikasi" value={data.belum_published} color="orange" />
              </div>
            </div>

            {/* Status publish saat ini */}
            <div className="bg-white rounded-2xl border border-brand-azure/15 p-5 sm:p-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Status Publikasi</p>

              {sudahPublished ? (
                <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800">Pengumuman sudah dipublikasikan</p>
                    <p className="text-xs text-green-600 mt-0.5">{data.sudah_published} dari {data.total_hasil} hasil sudah bisa dilihat peserta.</p>
                  </div>
                </div>
              ) : data.tanggal_publish ? (
                <div className="flex items-start gap-3 rounded-xl bg-brand-sky/20 border border-brand-azure/30 px-4 py-3">
                  <svg className="w-5 h-5 text-brand-azure mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-brand-navy">Dijadwalkan otomatis</p>
                    <p className="text-xs text-brand-azure mt-0.5">
                      Pengumuman akan terpublikasi pada <strong>{formatTanggalWaktu(data.tanggal_publish)}</strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl bg-brand-cream border border-brand-azure/20 px-4 py-3">
                  <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <p className="text-sm text-slate-600">Pengumuman belum dipublikasikan dan belum dijadwalkan.</p>
                </div>
              )}
            </div>

            {/* Aksi — publish baru */}
            {!sudahPublished && (
              <div className="bg-white rounded-2xl border border-brand-azure/15 p-5 sm:p-6 space-y-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Atur Publikasi</p>

                {/* Jadwalkan otomatis */}
                <div>
                  <p className="text-sm font-medium text-brand-navy mb-1">Jadwalkan Otomatis</p>
                  <p className="text-xs text-slate-500 mb-3">Pengumuman akan terpublikasi sendiri pada waktu yang ditentukan.</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input type="datetime-local" value={tglInput} onChange={e => setTglInput(e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-brand-azure/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-azure bg-white text-brand-navy" />
                    <button onClick={jadwalkan} disabled={saving}
                      className="px-4 py-2.5 bg-brand-navy text-white text-sm font-medium rounded-lg hover:bg-brand-navy-dark disabled:opacity-40 transition-colors whitespace-nowrap">
                      Simpan Jadwal
                    </button>
                  </div>
                  {data.tanggal_publish && (
                    <button onClick={batalJadwal} disabled={saving}
                      className="mt-2 text-xs text-red-500 hover:text-red-700 underline">
                      Batalkan jadwal yang ada
                    </button>
                  )}
                </div>

                <div className="border-t border-brand-azure/15 pt-5">
                  <p className="text-sm font-medium text-brand-navy mb-1">Publish Sekarang</p>
                  <p className="text-xs text-slate-500 mb-3">Hasil seleksi langsung bisa dicek oleh peserta saat ini juga.</p>
                  <button onClick={publishSekarang} disabled={saving || data.total_hasil === 0}
                    className="w-full py-3 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {saving ? 'Memproses...' : 'Publikasikan Sekarang'}
                  </button>
                  {data.total_hasil === 0 && (
                    <p className="text-xs text-slate-400 mt-2 text-center">Tidak ada hasil seleksi yang bisa dipublikasikan.</p>
                  )}
                </div>
              </div>
            )}

            {/* Aksi — unpublish (hanya tampil kalau sudah published) */}
            {sudahPublished && (
              <div className="bg-white rounded-2xl border border-red-100 p-5 sm:p-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Tarik Pengumuman</p>
                <p className="text-xs text-slate-500 mb-4">
                  Pengumuman akan disembunyikan dari peserta. Kamu bisa mempublikasikan ulang kapan saja.
                </p>
                <button
                  onClick={unpublish}
                  disabled={saving}
                  className="w-full py-3 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                  {saving ? 'Memproses...' : 'Tarik Pengumuman (Unpublish)'}
                </button>
              </div>
            )}

            {/* Link cek publik */}
            <div className="bg-brand-cream rounded-2xl border border-brand-azure/15 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Link Pengumuman Publik</p>
              <p className="text-xs text-slate-500 mb-3">Bagikan link ini kepada peserta untuk cek hasil seleksi.</p>
              <a href="/pengumuman" target="_blank"
                className="inline-flex items-center gap-2 text-sm text-brand-navy font-mono bg-white border border-brand-azure/30 rounded-lg px-3 py-2 hover:bg-brand-sky/15 transition-colors">
                /pengumuman
                <svg className="w-4 h-4 text-brand-azure" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    navy:   'bg-brand-navy text-white',
    blue:   'bg-brand-sky/30 text-brand-navy border border-brand-azure/20',
    green:  'bg-green-50 text-green-800 border border-green-200',
    red:    'bg-red-50 text-red-800 border border-red-200',
    orange: 'bg-amber-50 text-amber-800 border border-amber-200',
  }
  return (
    <div className={`rounded-xl px-4 py-3 ${colors[color] ?? colors.blue}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-0.5 opacity-75">{label}</p>
    </div>
  )
}
