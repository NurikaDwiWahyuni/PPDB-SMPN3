import type { Metadata } from 'next'
import PengumumanClient from './_components/PengumumanClient'

export const metadata: Metadata = {
  title: 'Pengumuman Hasil Seleksi — SPMB 2026/2027',
}

export default function PengumumanPage() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-10">
        <a href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-navy transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke beranda
        </a>
        <h1 className="text-xl sm:text-2xl font-semibold text-brand-navy mb-1">Pengumuman Hasil Seleksi</h1>
        <p className="text-sm text-slate-500 mb-8">Masukkan NISN atau nomor pendaftaran untuk melihat hasil seleksi.</p>
        <PengumumanClient />
      </div>
    </div>
  )
}
