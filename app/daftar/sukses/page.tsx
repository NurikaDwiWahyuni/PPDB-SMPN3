import type { Metadata } from 'next'
import Link from 'next/link'
import { NotifWA } from '@/app/_components/ui'

export const metadata: Metadata = {
  title: 'Pendaftaran Berhasil — SPMB 2026/2027',
}

interface Props {
  searchParams: Promise<{ nomor?: string }>
}

export default async function SuksesPage({ searchParams }: Props) {
  const { nomor } = await searchParams
  const nomorPendaftaran = nomor ?? 'SPMB-2026-???'

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-brand-azure/15 overflow-hidden">
          {/* Header hijau */}
          <div className="bg-green-50 border-b border-green-100 px-6 py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-brand-navy mb-1">Pendaftaran Berhasil!</h1>
            <p className="text-sm text-slate-500">Simpan nomor pendaftaran Anda</p>
          </div>

          {/* Nomor pendaftaran */}
          <div className="px-5 sm:px-6 py-6">
            <div className="bg-brand-cream rounded-xl border border-brand-azure/15 px-4 sm:px-5 py-5 text-center mb-5">
              <p className="text-xs text-slate-400 mb-2">Nomor pendaftaran Anda</p>
              <p className="text-xl sm:text-2xl font-mono font-semibold text-brand-navy tracking-wider break-all">{nomorPendaftaran}</p>
              <p className="text-xs text-slate-400 mt-2">Gunakan nomor ini untuk memantau status pendaftaran</p>
            </div>

            <NotifWA pesan="Nomor pendaftaran sudah dikirim ke WhatsApp Anda. Pantau status verifikasi berkas melalui halaman status." />

            {/* Info tahapan selanjutnya */}
            <div className="mt-5 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tahapan selanjutnya</p>
              {[
                { no: 1, label: 'Admin sekolah akan memverifikasi berkas Anda' },
                { no: 2, label: 'Jika ada dokumen bermasalah, notifikasi akan dikirim ke WhatsApp' },
                { no: 3, label: 'Setelah berkas valid, proses seleksi akan dilakukan' },
                { no: 4, label: 'Pengumuman hasil seleksi: 7 Juli 2026' },
              ].map((t) => (
                <div key={t.no} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-brand-sky/30 text-brand-navy text-xs flex items-center justify-center flex-shrink-0 font-medium mt-0.5">{t.no}</span>
                  <span className="text-slate-600">{t.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Link
                href={`/status?nomor=${encodeURIComponent(nomorPendaftaran)}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-brand-navy text-white text-sm font-medium hover:bg-brand-navy-dark transition-colors"
              >
                Pantau status pendaftaran
              </Link>
              <Link
                href="/"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-brand-azure/30 text-brand-navy text-sm font-medium hover:bg-brand-cream transition-colors"
              >
                Kembali ke beranda
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
