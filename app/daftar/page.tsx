import type { Metadata } from 'next'
import FormPendaftaran from './_components/FormPendaftaran'

export const metadata: Metadata = {
  title: 'Daftar SPMB 2026/2027',
  description: 'Formulir pendaftaran peserta didik baru online',
}

export default function DaftarPage() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <a href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-navy transition-colors mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke beranda
          </a>
          <h1 className="text-xl sm:text-2xl font-semibold text-brand-navy">Formulir Pendaftaran</h1>
          <p className="text-sm text-slate-500 mt-1">SPMB 2026/2027 · SMP Negeri 3 Bagan Sinembah</p>
        </div>
        <FormPendaftaran />
      </div>
    </div>
  )
}
