'use client'

import { useState } from 'react'

/**
 * TombolExport — komponen reusable untuk export data pendaftaran.
 * Letakkan di halaman admin manapun yang membutuhkan tombol download.
 *
 * Contoh pemakaian:
 *   import TombolExport from '@/app/_components/TombolExport'
 *   <TombolExport />
 */
export default function TombolExport() {
  const [loading, setLoading] = useState<'xlsx' | 'csv' | null>(null)

  async function download(format: 'xlsx' | 'csv') {
    setLoading(format)
    try {
      const res = await fetch(`/api/export?format=${format}`)
      if (!res.ok) throw new Error('Gagal mengunduh file.')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `data-pendaftaran-spmb-2026-${new Date().toISOString().slice(0, 10)}.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Gagal mengunduh file. Silakan coba lagi.')
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Tombol utama: Excel */}
      <button
        type="button"
        onClick={() => download('xlsx')}
        disabled={loading !== null}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-green-600 bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {loading === 'xlsx' ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Mengunduh...
          </>
        ) : (
          <>
            {/* Ikon Excel */}
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 17l2-3-2-3h1.7l1.3 2 1.3-2H14.5l-2 3 2 3h-1.7l-1.3-2-1.3 2H8.5z"/>
            </svg>
            Export Excel (.xlsx)
          </>
        )}
      </button>

      {/* Tombol sekunder: CSV */}
      <button
        type="button"
        onClick={() => download('csv')}
        disabled={loading !== null}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 bg-white text-zinc-700 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 transition-colors"
      >
        {loading === 'csv' ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Mengunduh...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </>
        )}
      </button>

      <span className="text-xs text-zinc-400">
        Mengunduh semua data pendaftaran
      </span>
    </div>
  )
}
