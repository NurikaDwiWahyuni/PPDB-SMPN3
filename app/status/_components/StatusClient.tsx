'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BadgeStatus, BadgeStatusDokumen, InfoBox } from '@/app/_components/ui'
import { LABEL_DOKUMEN, formatTanggalWaktu } from '@/app/_lib/utils'
import type { PendaftaranDetail } from '@/app/_lib/types'

export default function StatusClient({ nomorAwal }: { nomorAwal?: string }) {
  const [nomor, setNomor] = useState(nomorAwal ?? '')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PendaftaranDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (nomorAwal) cek(nomorAwal)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function cek(n?: string) {
    const q = (n ?? nomor).trim()
    if (!q) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch(`/api/status?nomor=${encodeURIComponent(q)}`)
      const json = await res.json()
      if (json.success) setData(json.data)
      else setError(json.message ?? 'Data tidak ditemukan.')
    } catch {
      setError('Terjadi kesalahan. Periksa koneksi internet Anda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-8">
        <input
          type="text"
          value={nomor}
          onChange={(e) => setNomor(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && cek()}
          placeholder="cth: SPMB-2026-00142"
          className="flex-1 px-3 py-2.5 border border-brand-azure/30 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-azure"
        />
        <button
          onClick={() => cek()}
          disabled={loading || !nomor.trim()}
          className="px-4 py-2.5 rounded-lg bg-brand-navy text-white text-sm font-medium hover:bg-brand-navy-dark disabled:opacity-50 transition-colors"
        >
          {loading ? 'Mencari...' : 'Cek Status'}
        </button>
      </div>

      {error && <InfoBox variant="danger">{error}</InfoBox>}

      {data && (
        <div className="space-y-5">
          {/* ── Kartu utama ── */}
          <div className="bg-white rounded-xl border border-brand-azure/15 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-brand-navy break-words">{data.data_siswa.nama_lengkap}</h2>
                <p className="text-xs text-slate-400 mt-0.5 break-words">
                  {data.nomor_pendaftaran} · Jalur {data.jalur.nama_jalur.charAt(0).toUpperCase() + data.jalur.nama_jalur.slice(1)}
                </p>
              </div>
              <BadgeStatus status={data.status} />
            </div>

            {/* Pesan sesuai status */}
            {data.status === 'perlu_perbaikan' && (
              <InfoBox variant="warn">
                <p className="font-medium mb-1">Ada berkas yang perlu diperbaiki</p>
                {data.catatan_admin && <p className="text-xs">{data.catatan_admin}</p>}
                <Link
                  href={`/perbaikan?nomor=${encodeURIComponent(data.nomor_pendaftaran)}`}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium underline"
                >
                  Perbaiki dokumen →
                </Link>
              </InfoBox>
            )}
            {data.status === 'menunggu_verifikasi' && (
              <InfoBox variant="info">Berkas Anda sedang dalam antrian verifikasi oleh admin sekolah.</InfoBox>
            )}
            {data.status === 'terverifikasi' && (
              <InfoBox variant="success">Semua berkas valid. Proses seleksi akan segera dilakukan.</InfoBox>
            )}
            {(data.status === 'diterima' || data.status === 'tidak_diterima') && (
              <InfoBox variant={data.status === 'diterima' ? 'success' : 'danger'}>
                {data.status === 'diterima'
                  ? '🎉 Selamat! Calon siswa dinyatakan DITERIMA. Harap lakukan daftar ulang.'
                  : 'Calon siswa dinyatakan tidak diterima. Terima kasih sudah mendaftar.'}
              </InfoBox>
            )}
          </div>

          {/* ── Status dokumen ── */}
          <div className="bg-white rounded-xl border border-brand-azure/15 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-brand-navy mb-4">Status dokumen</h3>
            <div className="space-y-3">
              {data.dokumen.map((dok) => (
                <div key={dok.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-brand-navy">{LABEL_DOKUMEN[dok.jenis_dokumen]}</p>
                    {dok.catatan_admin && (
                      <p className="text-xs text-orange-600 mt-0.5">↳ {dok.catatan_admin}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">{formatTanggalWaktu(dok.uploaded_at)}</p>
                  </div>
                  <BadgeStatusDokumen status={dok.status} />
                </div>
              ))}
            </div>
          </div>

          {/* ── Riwayat timeline ── */}
          <div className="bg-white rounded-xl border border-brand-azure/15 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-brand-navy mb-4">Riwayat</h3>
            <div className="relative">
              <div className="absolute left-2.5 top-0 bottom-0 w-px bg-brand-cream" />
              <div className="space-y-4">
                <div className="flex items-start gap-4 relative">
                  <div className="w-5 h-5 rounded-full bg-brand-navy flex items-center justify-center z-10 flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-navy">Pendaftaran dikirim</p>
                    <p className="text-xs text-slate-400">{formatTanggalWaktu(data.tanggal_daftar)}</p>
                  </div>
                </div>
                {data.status !== 'menunggu_verifikasi' && (
                  <div className="flex items-start gap-4 relative">
                    <div className="w-5 h-5 rounded-full bg-brand-navy flex items-center justify-center z-10 flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-brand-navy">Berkas diperiksa admin</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                        Status: <BadgeStatus status={data.status} />
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {data.status === 'perlu_perbaikan' && (
            <Link
              href={`/perbaikan?nomor=${encodeURIComponent(data.nomor_pendaftaran)}`}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-brand-navy text-white text-sm font-medium hover:bg-brand-navy-dark transition-colors"
            >
              Perbaiki dokumen sekarang
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
