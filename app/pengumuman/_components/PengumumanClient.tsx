'use client'

import { useState } from 'react'
import type { HasilSeleksi } from '@/app/_lib/types'

export default function PengumumanClient() {
  const [query, setQuery]   = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData]     = useState<HasilSeleksi | null>(null)
  const [error, setError]   = useState<string | null>(null)

  async function cek() {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res  = await fetch(`/api/pengumuman?q=${encodeURIComponent(q)}`)
      const json = await res.json()
      if (json.success) setData(json.data)
      else setError(json.message ?? 'Data tidak ditemukan atau pengumuman belum dipublikasikan.')
    } catch {
      setError('Terjadi kesalahan. Periksa koneksi internet Anda.')
    } finally {
      setLoading(false)
    }
  }

  const diterima = data?.hasil === 'diterima'

  return (
    <div>
      {/* Input pencarian */}
      <div className="flex flex-col sm:flex-row gap-2 mb-8">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && cek()}
          placeholder="Masukkan NISN atau nomor pendaftaran"
          className="flex-1 px-3 py-2.5 border border-brand-azure/30 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-azure"
        />
        <button
          onClick={cek}
          disabled={loading || !query.trim()}
          className="px-4 py-2.5 rounded-lg bg-brand-navy text-white text-sm font-medium hover:bg-brand-navy-dark disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {loading ? 'Mencari...' : 'Cek Hasil'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl px-4 py-3 border bg-red-50 border-red-200 mb-6">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Hasil */}
      {data && (
        <div className={`rounded-2xl border p-5 sm:p-6 ${
          diterima
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          {/* Header status */}
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              diterima ? 'bg-green-500' : 'bg-red-400'
            }`}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                {diterima
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                }
              </svg>
            </div>
            <div>
              <p className={`text-base font-bold ${diterima ? 'text-green-800' : 'text-red-800'}`}>
                {diterima ? 'DITERIMA' : 'TIDAK DITERIMA'}
              </p>
              <p className={`text-xs ${diterima ? 'text-green-600' : 'text-red-500'}`}>
                {diterima
                  ? 'Selamat! Calon siswa dinyatakan diterima.'
                  : 'Terima kasih sudah mendaftar.'}
              </p>
            </div>
          </div>

          {/* Detail */}
          <div className={`rounded-xl p-4 space-y-3 ${diterima ? 'bg-green-100/60' : 'bg-red-100/60'}`}>
            <Row label="Nama Lengkap"      value={data.nama_lengkap} />
            <Row label="NISN"              value={data.nisn} />
            <Row label="Nomor Pendaftaran" value={data.nomor_pendaftaran} />
            <Row label="Jalur Pendaftaran" value={capitalize(data.jalur)} />
          </div>

          {data.catatan && (
            <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${diterima ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <span className="font-medium">Catatan: </span>{data.catatan}
            </div>
          )}

          {diterima && (
            <p className="mt-4 text-xs text-green-700">
              Harap lakukan daftar ulang sesuai jadwal yang telah ditentukan oleh pihak sekolah.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4">
      <p className="text-xs text-slate-500 sm:w-36 flex-shrink-0">{label}</p>
      <p className="text-sm font-medium text-brand-navy">{value}</p>
    </div>
  )
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
