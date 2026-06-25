'use client'

import { useState } from 'react'
import type { HasilSeleksi } from '@/app/_lib/types'

export default function CekPengumuman() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasil, setHasil] = useState<HasilSeleksi | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dicari, setDicari] = useState(false)

  async function handleCek() {
    if (!input.trim()) return
    setLoading(true)
    setError(null)
    setHasil(null)
    setDicari(true)
    try {
      const res = await fetch(`/api/pengumuman?q=${encodeURIComponent(input.trim())}`)
      const json = await res.json()
      if (json.success && json.data) {
        setHasil(json.data)
      } else {
        setError(json.message || 'Data tidak ditemukan atau belum diumumkan.')
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCek()}
          placeholder="Masukkan NISN atau nomor pendaftaran..."
          className="flex-1 px-3 py-2.5 border border-brand-azure/30 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-azure"
        />
        <button
          onClick={handleCek}
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-lg bg-brand-navy text-white text-sm font-medium hover:bg-brand-navy-dark disabled:opacity-50 transition-colors"
        >
          {loading ? 'Mencari...' : 'Cek'}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Pengumuman hasil seleksi dibuka pada <span className="font-medium text-brand-navy">2 Juli 2026</span>
      </p>

      {dicari && !loading && (
        <div className="mt-6 max-w-lg">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          {hasil && (
            <div className="rounded-xl border border-brand-azure/15 bg-white overflow-hidden">
              <div className={`px-5 py-4 ${hasil.hasil === 'diterima' ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${hasil.hasil === 'diterima' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {hasil.hasil === 'diterima' ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-navy truncate">{hasil.nama_lengkap}</p>
                    <p className={`text-sm font-medium ${hasil.hasil === 'diterima' ? 'text-green-700' : 'text-red-700'}`}>
                      {hasil.hasil === 'diterima' ? '✓ Diterima' : '✕ Tidak Diterima'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 space-y-2">
                {[
                  { label: 'NISN',               nilai: hasil.nisn },
                  { label: 'Nomor pendaftaran',   nilai: hasil.nomor_pendaftaran },
                  { label: 'Jalur',               nilai: hasil.jalur.charAt(0).toUpperCase() + hasil.jalur.slice(1) },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between gap-3 text-sm">
                    <span className="text-slate-500">{r.label}</span>
                    <span className="font-medium text-brand-navy text-right">{r.nilai}</span>
                  </div>
                ))}
                {hasil.catatan && (
                  <p className="text-xs text-slate-500 pt-2 border-t border-brand-cream">{hasil.catatan}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
