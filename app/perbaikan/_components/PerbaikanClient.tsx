'use client'

import { useState, useEffect } from 'react'
import { InfoBox, NotifWA, Tombol } from '@/app/_components/ui'
import { LABEL_DOKUMEN, validasiFile } from '@/app/_lib/utils'
import type { JenisDokumen } from '@/app/_lib/types'

interface DokumenPerlu {
  id: number
  jenis_dokumen: JenisDokumen
  catatan_admin: string | null
}

interface DataPerbaikan {
  nomor_pendaftaran: string
  nama_siswa: string
  catatan_admin: string | null
  dokumen_perlu_revisi: DokumenPerlu[]
}

export default function PerbaikanClient({
  nomorPendaftaran,
  token,
}: {
  nomorPendaftaran?: string
  token?: string
}) {
  const [nomor, setNomor] = useState(nomorPendaftaran ?? '')
  const [data, setData] = useState<DataPerbaikan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [files, setFiles] = useState<Partial<Record<JenisDokumen, File>>>({})
  const [fileErrors, setFileErrors] = useState<Partial<Record<JenisDokumen, string>>>({})
  const [sukses, setSukses] = useState(false)
  const [mengirim, setMengirim] = useState(false)

  useEffect(() => {
    if (nomorPendaftaran) muat(nomorPendaftaran)
  }, []) // eslint-disable-line

  async function muat(n: string) {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch(`/api/perbaikan?nomor=${encodeURIComponent(n)}${token ? `&token=${token}` : ''}`)
      const json = await res.json()
      if (json.success) setData(json.data)
      else setError(json.message ?? 'Data tidak ditemukan.')
    } catch {
      setError('Gagal memuat data. Periksa koneksi internet Anda.')
    } finally {
      setLoading(false)
    }
  }

  function handleFile(jenis: JenisDokumen, file: File | undefined) {
    if (!file) return
    const err = validasiFile(file)
    if (err) {
      setFileErrors((p) => ({ ...p, [jenis]: err }))
      return
    }
    setFileErrors((p) => ({ ...p, [jenis]: undefined }))
    setFiles((p) => ({ ...p, [jenis]: file }))
  }

  async function handleKirim() {
    if (!data) return
    setMengirim(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('nomor_pendaftaran', data.nomor_pendaftaran)
      if (token) fd.append('token', token)
      data.dokumen_perlu_revisi.forEach(({ jenis_dokumen }) => {
        const f = files[jenis_dokumen]
        if (f) fd.append(jenis_dokumen, f)
      })
      const res = await fetch('/api/perbaikan', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.success) setSukses(true)
      else setError(json.message ?? 'Terjadi kesalahan.')
    } catch {
      setError('Gagal mengirim. Periksa koneksi internet Anda.')
    } finally {
      setMengirim(false)
    }
  }

  const semuaLengkap = data?.dokumen_perlu_revisi.every((d) => files[d.jenis_dokumen]) ?? false

  if (sukses) {
    return (
      <div className="bg-white rounded-xl border border-brand-azure/15 p-6 sm:p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-brand-navy mb-2">Perbaikan berhasil dikirim!</h2>
        <p className="text-sm text-slate-500 mb-6">Admin akan memeriksa ulang dokumen yang Anda kirimkan.</p>
        <NotifWA pesan="Notifikasi hasil verifikasi ulang akan dikirim ke WhatsApp Anda." />
        <a href={`/status?nomor=${encodeURIComponent(data?.nomor_pendaftaran ?? '')}`}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-navy text-white text-sm font-medium hover:bg-brand-navy-dark"
        >
          Pantau status pendaftaran
        </a>
      </div>
    )
  }

  return (
    <div>
      {/* Form cari nomor jika belum ada */}
      {!data && !loading && (
        <div className="bg-white rounded-xl border border-brand-azure/15 p-4 sm:p-5 mb-6">
          <p className="text-sm font-medium text-brand-navy mb-3">Masukkan nomor pendaftaran</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={nomor}
              onChange={(e) => setNomor(e.target.value)}
              placeholder="cth: SPMB-2026-00142"
              className="flex-1 px-3 py-2.5 border border-brand-azure/30 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-azure"
            />
            <button
              onClick={() => muat(nomor)}
              className="px-4 py-2.5 rounded-lg bg-brand-navy text-white text-sm font-medium hover:bg-brand-navy-dark"
            >
              Cari
            </button>
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-slate-500">Memuat data...</p>}
      {error && <InfoBox variant="danger">{error}</InfoBox>}

      {data && (
        <div className="space-y-5">
          {/* ── Catatan admin ── */}
          <div className="bg-white rounded-xl border border-brand-azure/15 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-brand-navy break-words">{data.nama_siswa}</h2>
                <p className="text-xs text-slate-400">{data.nomor_pendaftaran}</p>
              </div>
              <span className="text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full w-fit">Perlu Perbaikan</span>
            </div>
            {data.catatan_admin && (
              <InfoBox variant="warn">
                <p className="font-medium mb-1">Catatan dari admin:</p>
                <p className="text-xs whitespace-pre-line">{data.catatan_admin}</p>
              </InfoBox>
            )}
          </div>

          {/* ── Upload ulang dokumen ── */}
          <div className="bg-white rounded-xl border border-brand-azure/15 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-brand-navy mb-4">
              Dokumen yang perlu diperbaiki ({data.dokumen_perlu_revisi.length})
            </h3>
            <div className="space-y-3">
              {data.dokumen_perlu_revisi.map((dok) => {
                const file = files[dok.jenis_dokumen]
                const err = fileErrors[dok.jenis_dokumen]
                return (
                  <div key={dok.id}>
                    <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${file ? 'border-green-200 bg-green-50' : 'border-dashed border-red-200 bg-red-50 hover:border-red-400'}`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${file ? 'bg-green-100' : 'bg-red-100'}`}>
                        {file ? (
                          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-brand-navy">{LABEL_DOKUMEN[dok.jenis_dokumen]}</p>
                        {dok.catatan_admin && (
                          <p className="text-xs text-orange-600 mb-0.5">Catatan: {dok.catatan_admin}</p>
                        )}
                        <p className={`text-xs truncate ${file ? 'text-green-600' : 'text-slate-400'}`}>
                          {file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB` : 'Klik untuk pilih file baru'}
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        className="hidden"
                        onChange={(e) => handleFile(dok.jenis_dokumen, e.target.files?.[0])}
                      />
                    </label>
                    {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
                  </div>
                )
              })}
            </div>
          </div>

          <NotifWA pesan="Setelah perbaikan dikirim, admin akan melakukan verifikasi ulang dan hasilnya akan dikirim ke WhatsApp Anda." />

          {error && <InfoBox variant="danger">{error}</InfoBox>}

          <Tombol onClick={handleKirim} disabled={!semuaLengkap || mengirim} className="w-full justify-center">
            {mengirim ? 'Mengirim...' : 'Kirim Perbaikan'}
          </Tombol>
        </div>
      )}
    </div>
  )
}
