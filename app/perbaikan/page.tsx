import type { Metadata } from 'next'
import PerbaikanClient from './_components/PerbaikanClient'

export const metadata: Metadata = {
  title: 'Perbaikan Dokumen — SPMB 2026/2027',
}

interface Props {
  searchParams: Promise<{ nomor?: string; token?: string }>
}

export default async function PerbaikanPage({ searchParams }: Props) {
  const { nomor, token } = await searchParams
  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-10">
        <h1 className="text-xl sm:text-2xl font-semibold text-brand-navy mb-1">Perbaikan dokumen</h1>
        <p className="text-sm text-slate-500 mb-2">
          Halaman ini dapat diakses langsung dari tautan WhatsApp tanpa perlu login.
        </p>
        <div className="mb-8 rounded-lg bg-brand-sky/20 border border-brand-azure/30 px-4 py-3 text-sm text-brand-navy">
          Upload ulang hanya dokumen yang ditandai perlu diperbaiki oleh admin.
        </div>
        <PerbaikanClient nomorPendaftaran={nomor} token={token} />
      </div>
    </div>
  )
}
