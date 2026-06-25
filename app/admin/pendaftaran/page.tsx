'use client'

import { useEffect, useState, useCallback } from 'react'
import { BadgeStatus, BadgeStatusDokumen } from '@/app/_components/ui'
import { LABEL_JALUR, formatTanggalWaktu } from '@/app/_lib/utils'
import type { StatusPendaftaran, NamaJalur, StatusDokumen } from '@/app/_lib/types'
import TombolExport from '@/app/_components/TombolExport'

// ── Tipe data ──────────────────────────────────────────────────────────────

interface Row {
  id: number
  nomor_pendaftaran: string | null
  status: StatusPendaftaran
  tanggal_daftar: string
  jalur: NamaJalur
  nama_lengkap: string
  nisn: string
  nomor_wa: string
}

interface Dokumen {
  id: number
  jenis_dokumen: string
  path_file: string
  mime_type: string
  status: StatusDokumen
  catatan_admin: string | null
  uploaded_at: string
}

interface DetailData {
  id: number
  nomor_pendaftaran: string | null
  status: StatusPendaftaran
  tanggal_daftar: string
  catatan_admin: string | null
  jalur: { nama_jalur: NamaJalur }
  data_siswa: {
    nama_lengkap: string
    nisn: string | null
    nomor_kk: string
    tempat_lahir: string
    tanggal_lahir: string
    jenis_kelamin: 'L' | 'P'
    agama: string
    asal_sekolah: string | null
  } | null
  data_orangtua: {
    nama_ayah: string
    nama_ibu: string
    nomor_wa: string
    alamat: string
  } | null
  dokumen: Dokumen[]
}

// ── Konstanta ──────────────────────────────────────────────────────────────

const LABEL_DOKUMEN: Record<string, string> = {
  akta:     'Akta Kelahiran',
  skl:      'Surat Keterangan Lulus',
  kk:       'Kartu Keluarga',
  ktp_ayah: 'KTP Ayah',
  ktp_ibu:  'KTP Ibu',
}

const STATUS_OPTS = [
  { value: '',                    label: 'Semua Status' },
  { value: 'menunggu_verifikasi', label: 'Menunggu Verifikasi' },
  { value: 'perlu_perbaikan',     label: 'Perlu Perbaikan' },
  { value: 'terverifikasi',       label: 'Terverifikasi' },
  { value: 'diterima',            label: 'Diterima' },
  { value: 'tidak_diterima',      label: 'Tidak Diterima' },
]

const JALUR_OPTS = [
  { value: '',         label: 'Semua Jalur' },
  { value: 'zonasi',   label: 'Zonasi' },
  { value: 'prestasi', label: 'Prestasi' },
  { value: 'afirmasi', label: 'Afirmasi' },
  { value: 'mutasi',   label: 'Mutasi' },
]

// Dokumen terbaru per jenis (ambil yang paling baru)
function dokumenTerbaru(dokumen: Dokumen[]): Dokumen[] {
  const map = new Map<string, Dokumen>()
  for (const d of dokumen) {
    const existing = map.get(d.jenis_dokumen)
    if (!existing || new Date(d.uploaded_at) > new Date(existing.uploaded_at)) {
      map.set(d.jenis_dokumen, d)
    }
  }
  return Array.from(map.values())
}

// ── Komponen utama ─────────────────────────────────────────────────────────

export default function PendaftaranPage() {
  const [rows, setRows]           = useState<Row[]>([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [totalPage, setTotalPage] = useState(1)
  const [loading, setLoading]     = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  const [filterStatus, setFilterStatus] = useState('')
  const [filterJalur,  setFilterJalur]  = useState('')
  const [q, setQ]                       = useState('')
  const [qInput, setQInput]             = useState('')

  // Modal detail
  const [selectedRow, setSelectedRow]         = useState<Row | null>(null)
  const [detail, setDetail]                   = useState<DetailData | null>(null)
  const [detailLoading, setDetailLoading]     = useState(false)

  // Aksi
  const [aksi, setAksi]       = useState('')
  const [catatan, setCatatan] = useState('')
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')

  const [dokChecked, setDokChecked]   = useState<Record<string, boolean>>({})
  const [dokCatatan, setDokCatatan]   = useState<Record<string, string>>({})

  const [preview, setPreview] = useState<{ url: string; mime: string; label: string } | null>(null)

  // Modal hapus pendaftar
  const [hapusRow, setHapusRow]   = useState<Row | null>(null)
  const [hapusSaving, setHapusSaving] = useState(false)
  const [hapusMsg, setHapusMsg]   = useState('')

  // ── Load daftar ────────────────────────────────────────────────────────
  const load = useCallback(() => {
    setLoading(true)
    const sp = new URLSearchParams()
    if (filterStatus) sp.set('status', filterStatus)
    if (filterJalur)  sp.set('jalur',  filterJalur)
    if (q)            sp.set('q', q)
    sp.set('page', String(page))

    fetch(`/api/admin/pendaftaran?${sp}`)
      .then((r) => r.json())
      .then((j) => {
        setRows(j.data?.rows ?? [])
        setTotal(j.data?.total ?? 0)
        setTotalPage(j.data?.total_page ?? 1)
        setIsSuperAdmin(j.data?.is_superadmin ?? false)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [filterStatus, filterJalur, q, page])

  useEffect(() => { load() }, [load])

  // ── Buka detail ────────────────────────────────────────────────────────
  function bukaDetail(row: Row) {
    setSelectedRow(row)
    setDetail(null)
    setAksi('')
    setCatatan('')
    setDokChecked({})
    setDokCatatan({})
    setMsg('')
    setDetailLoading(true)

    fetch(`/api/admin/pendaftaran/${row.id}`)
      .then((r) => r.json())
      .then((j) => {
        setDetail(j.data ?? null)
        setDetailLoading(false)
      })
      .catch(() => setDetailLoading(false))
  }

  function tutupDetail() {
    setSelectedRow(null)
    setDetail(null)
    setPreview(null)
  }

  function gantiAksi(val: string) {
    setAksi(val)
    setMsg('')
    // Reset state perbaikan kalau ganti ke aksi lain
    if (val !== 'perbaikan') {
      setDokChecked({})
      setDokCatatan({})
    }
  }

  // ── Simpan aksi ────────────────────────────────────────────────────────
  async function simpanAksi() {
    if (!selectedRow || !aksi) return

    // Validasi: kalau perbaikan, minimal 1 dokumen harus dicentang
    if (aksi === 'perbaikan') {
      const adaYangDicentang = Object.values(dokChecked).some(Boolean)
      if (!adaYangDicentang) {
        setMsg('✗ Tandai minimal satu dokumen yang perlu diperbaiki.')
        return
      }
    }

    setSaving(true)
    setMsg('')

    // Buat dokumen_catatan: hanya yang dicentang
    const dokumen_catatan: Record<string, string> = {}
    if (aksi === 'perbaikan') {
      for (const [jenis, checked] of Object.entries(dokChecked)) {
        if (checked) {
          dokumen_catatan[jenis] = dokCatatan[jenis] ?? ''
        }
      }
    }

    const res = await fetch('/api/admin/pendaftaran', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedRow.id, aksi, catatan, dokumen_catatan }),
    })
    const j = await res.json()
    setSaving(false)
    if (j.success) {
      load()
      tutupDetail()
    } else {
      setMsg('✗ ' + j.message)
    }
  }

  // ── Preview dokumen ────────────────────────────────────────────────────
  function bukaPreview(dok: Dokumen) {
    setPreview({
      url:   `/api/admin/dokumen?id=${dok.id}`,
      mime:  dok.mime_type,
      label: LABEL_DOKUMEN[dok.jenis_dokumen] ?? dok.jenis_dokumen,
    })
  }

  // ── Hapus pendaftar (superadmin only) ────────────────────────────────
  async function konfirmasiHapus() {
    if (!hapusRow) return
    setHapusSaving(true)
    setHapusMsg('')
    try {
      const res  = await fetch('/api/admin/pendaftaran', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: hapusRow.id }),
      })
      const json = await res.json()
      if (json.success) {
        setHapusRow(null)
        load()
      } else {
        setHapusMsg(json.message ?? 'Gagal menghapus.')
      }
    } catch {
      setHapusMsg('Terjadi kesalahan.')
    } finally {
      setHapusSaving(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-brand-navy">Data Pendaftar</h1>
          <p className="text-sm text-slate-500 mt-1">{total} total pendaftar</p>
        </div>
        <TombolExport />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-brand-azure/30 rounded-lg text-sm bg-white text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-azure">
          {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filterJalur} onChange={(e) => { setFilterJalur(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-brand-azure/30 rounded-lg text-sm bg-white text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-azure">
          {JALUR_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="flex gap-2 flex-1 min-w-[200px]">
          <input type="text" placeholder="Cari nama, NISN, nomor..."
            value={qInput} onChange={(e) => setQInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setQ(qInput); setPage(1) } }}
            className="flex-1 px-3 py-2 border border-brand-azure/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-azure" />
          <button onClick={() => { setQ(qInput); setPage(1) }}
            className="px-4 py-2 bg-brand-navy text-white text-sm rounded-lg hover:bg-brand-navy-dark flex-shrink-0">Cari</button>
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl border border-brand-azure/15 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Memuat data...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Tidak ada data.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-brand-cream border-b border-brand-azure/15">
                <tr>
                  {['No. Daftar', 'Nama Siswa', 'NISN', 'Jalur', 'Tanggal Daftar', 'Status', 'Aksi'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-cream">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-brand-cream/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{r.nomor_pendaftaran ?? '-'}</td>
                    <td className="px-4 py-3 font-medium text-brand-navy whitespace-nowrap">{r.nama_lengkap}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">{r.nisn}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{LABEL_JALUR[r.jalur]}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatTanggalWaktu(r.tanggal_daftar)}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><BadgeStatus status={r.status} /></td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => bukaDetail(r)}
                          className="px-3 py-1.5 text-xs font-medium border border-brand-azure/30 rounded-lg hover:bg-brand-cream transition-colors">
                          Detail
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => { setHapusRow(r); setHapusMsg('') }}
                            className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPage > 1 && (
        <div className="mt-4 flex items-center gap-2 justify-end">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 text-sm border border-brand-azure/30 rounded-lg disabled:opacity-40 hover:bg-brand-cream">←</button>
          <span className="text-sm text-slate-600">Halaman {page} / {totalPage}</span>
          <button disabled={page >= totalPage} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 text-sm border border-brand-azure/30 rounded-lg disabled:opacity-40 hover:bg-brand-cream">→</button>
        </div>
      )}

      {/* ── Modal Detail ─────────────────────────────────────────────────── */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-2 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-auto">

            {/* Header */}
            <div className="flex items-start justify-between px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-brand-azure/15">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-brand-navy break-words">
                  {detail?.data_siswa?.nama_lengkap ?? selectedRow.nama_lengkap}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">{selectedRow.nomor_pendaftaran ?? '-'}</p>
              </div>
              <button onClick={tutupDetail} className="text-slate-400 hover:text-brand-navy ml-4 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {detailLoading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Memuat detail...</div>
            ) : detail ? (
              <div className="px-4 sm:px-6 py-5 space-y-6">

                {/* Status & Jalur */}
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Status:</span>
                    <BadgeStatus status={detail.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Jalur:</span>
                    <span className="text-sm font-medium text-brand-navy">{LABEL_JALUR[detail.jalur.nama_jalur]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Tanggal Daftar:</span>
                    <span className="text-sm text-slate-700">{formatTanggalWaktu(detail.tanggal_daftar)}</span>
                  </div>
                </div>

                {/* Data Siswa */}
                {detail.data_siswa && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Data Siswa</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <Field label="Nama Lengkap" value={detail.data_siswa.nama_lengkap} />
                      <Field label="NISN"          value={detail.data_siswa.nisn ?? '-'} mono />
                      <Field label="Nomor KK"      value={detail.data_siswa.nomor_kk} mono />
                      <Field label="Jenis Kelamin" value={detail.data_siswa.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
                      <Field label="Tempat Lahir"  value={detail.data_siswa.tempat_lahir} />
                      <Field label="Tanggal Lahir" value={new Date(detail.data_siswa.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} />
                      <Field label="Agama"         value={detail.data_siswa.agama} />
                      <Field label="Asal Sekolah"  value={detail.data_siswa.asal_sekolah ?? '-'} />
                    </div>
                  </div>
                )}

                {/* Data Orang Tua */}
                {detail.data_orangtua && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Data Orang Tua</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <Field label="Nama Ayah"    value={detail.data_orangtua.nama_ayah} />
                      <Field label="Nama Ibu"     value={detail.data_orangtua.nama_ibu} />
                      <Field label="No. WhatsApp" value={detail.data_orangtua.nomor_wa} mono />
                      <Field label="Alamat"       value={detail.data_orangtua.alamat} full />
                    </div>
                  </div>
                )}

                {/* Dokumen */}
                {detail.dokumen.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Dokumen</p>
                    <div className="space-y-2">
                      {dokumenTerbaru(detail.dokumen).map((dok) => {
                        const dicentang = aksi === 'perbaikan' && !!dokChecked[dok.jenis_dokumen]
                        return (
                          <div key={dok.id}
                            className={`rounded-lg border px-3 sm:px-4 py-3 transition-colors ${
                              aksi === 'perbaikan'
                                ? dicentang
                                  ? 'border-orange-300 bg-orange-50'
                                  : 'border-brand-azure/20 bg-brand-cream cursor-pointer hover:border-brand-azure/50'
                                : 'border-brand-azure/15 bg-brand-cream'
                            }`}
                            onClick={() => {
                              if (aksi === 'perbaikan') {
                                setDokChecked(p => ({ ...p, [dok.jenis_dokumen]: !p[dok.jenis_dokumen] }))
                              }
                            }}
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Checkbox saat mode perbaikan */}
                                {aksi === 'perbaikan' && (
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${dicentang ? 'bg-orange-500 border-orange-500' : 'border-slate-300'}`}>
                                    {dicentang && (
                                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                )}
                                {/* Icon file */}
                                <div className="w-8 h-8 rounded-lg bg-white border border-brand-azure/20 flex items-center justify-center flex-shrink-0">
                                  {dok.mime_type === 'application/pdf' ? (
                                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4 text-brand-azure" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                    </svg>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-medium text-slate-800">{LABEL_DOKUMEN[dok.jenis_dokumen] ?? dok.jenis_dokumen}</p>
                                    {dok.path_file.includes('_rev_') && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-sky/30 text-brand-navy border border-brand-azure/30">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        Upload Ulang
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400">{new Date(dok.uploaded_at).toLocaleDateString('id-ID')}</p>
                                  {dok.catatan_admin && (
                                    <p className="text-xs text-orange-600 mt-0.5">Catatan sebelumnya: {dok.catatan_admin}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                                <BadgeStatusDokumen status={dok.status} />
                                <button onClick={() => bukaPreview(dok)}
                                  className="px-3 py-1.5 text-xs font-medium border border-brand-azure/30 bg-white rounded-lg hover:bg-brand-cream transition-colors">
                                  Lihat
                                </button>
                                <a href={`/api/admin/dokumen?id=${dok.id}`} download
                                  className="px-3 py-1.5 text-xs font-medium border border-brand-azure/30 bg-white rounded-lg hover:bg-brand-cream transition-colors">
                                  Unduh
                                </a>
                              </div>
                            </div>

                            {/* Input catatan per dokumen — muncul kalau dicentang */}
                            {dicentang && (
                              <div className="mt-3 sm:ml-8" onClick={e => e.stopPropagation()}>
                                <input
                                  type="text"
                                  placeholder={`Catatan untuk ${LABEL_DOKUMEN[dok.jenis_dokumen]} (opsional)`}
                                  value={dokCatatan[dok.jenis_dokumen] ?? ''}
                                  onChange={(e) => setDokCatatan(p => ({ ...p, [dok.jenis_dokumen]: e.target.value }))}
                                  className="w-full px-3 py-2 border border-orange-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {aksi === 'perbaikan' && (
                      <p className="text-xs text-slate-400 mt-2">Klik dokumen untuk menandainya perlu diperbaiki. Bisa tambah catatan per dokumen.</p>
                    )}
                  </div>
                )}

                {/* Catatan admin sebelumnya */}
                {detail.catatan_admin && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Catatan Admin Sebelumnya</p>
                    <p className="text-sm text-amber-800">{detail.catatan_admin}</p>
                  </div>
                )}

                {/* ── Aksi: hanya 3 pilihan ── */}
                <div className="border-t border-brand-azure/15 pt-5">
                  <p className="text-xs font-semibold text-slate-600 mb-3">Keputusan Admin</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                    {[
                      { val: 'terima',    label: '✓ Terima',          cls: 'border-green-200 text-green-700 hover:bg-green-50',   active: 'bg-green-50 ring-green-400' },
                      { val: 'perbaikan', label: '⚠ Minta Perbaikan', cls: 'border-orange-200 text-orange-700 hover:bg-orange-50', active: 'bg-orange-50 ring-orange-400' },
                      { val: 'tolak',     label: '✗ Tidak Diterima',  cls: 'border-red-200 text-red-700 hover:bg-red-50',         active: 'bg-red-50 ring-red-400' },
                    ].map((a) => (
                      <button key={a.val} onClick={() => gantiAksi(a.val)}
                        className={`px-3 py-2.5 text-xs font-medium border rounded-lg transition-colors ${
                          aksi === a.val ? `${a.active} ring-2 ring-offset-1` : a.cls
                        }`}>
                        {a.label}
                      </button>
                    ))}
                  </div>

                  {/* Panduan mode perbaikan */}
                  {aksi === 'perbaikan' && (
                    <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2.5 mb-3">
                      <p className="text-xs text-orange-700 font-medium">Tandai dokumen yang perlu diulang di atas, lalu simpan.</p>
                      <p className="text-xs text-orange-600 mt-0.5">Orang tua akan diminta upload ulang hanya dokumen yang ditandai.</p>
                    </div>
                  )}

                  {/* Catatan umum */}
                  {aksi && (
                    <textarea
                      placeholder={
                        aksi === 'perbaikan' ? 'Catatan umum untuk orang tua (opsional)' :
                        aksi === 'terima'    ? 'Catatan tambahan (opsional)' :
                        'Alasan penolakan (opsional)'
                      }
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-brand-azure/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-azure resize-none mb-3"
                    />
                  )}

                  {msg && (
                    <p className={`text-xs mb-3 ${msg.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>
                  )}

                  <div className="flex gap-2">
                    <button onClick={tutupDetail}
                      className="flex-1 py-2.5 border border-brand-azure/30 text-brand-navy text-sm font-medium rounded-lg hover:bg-brand-cream transition-colors">
                      Tutup
                    </button>
                    <button onClick={simpanAksi} disabled={!aksi || saving}
                      className="flex-1 py-2.5 bg-brand-navy text-white text-sm font-medium rounded-lg hover:bg-brand-navy-dark disabled:opacity-40 transition-colors">
                      {saving ? 'Menyimpan...' : 'Simpan Keputusan'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">Gagal memuat detail.</div>
            )}
          </div>
        </div>
      )}

      {/* ── Preview Dokumen ──────────────────────────────────────────────── */}
      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-2 sm:px-4 py-4 sm:py-8">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col" style={{ maxHeight: '90vh' }}>
            <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-brand-azure/15">
              <p className="text-sm font-semibold text-slate-800 truncate">{preview.label}</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a href={preview.url} download
                  className="px-3 py-1.5 text-xs font-medium border border-brand-azure/30 rounded-lg hover:bg-brand-cream">
                  Unduh
                </a>
                <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-brand-navy">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-brand-cream">
              {preview.mime === 'application/pdf' ? (
                <iframe src={preview.url} className="w-full rounded" style={{ height: '70vh' }} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.url} alt={preview.label} className="max-w-full max-h-full object-contain rounded" />
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── Modal Konfirmasi Hapus Pendaftar (superadmin only) ──────────── */}
      {hapusRow && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-brand-navy mb-1">Hapus Data Pendaftar?</h2>
            <p className="text-sm text-slate-500 mb-1">
              Data <span className="font-semibold text-brand-navy">{hapusRow.nama_lengkap}</span> ({hapusRow.nomor_pendaftaran ?? '-'}) akan dihapus permanen beserta seluruh dokumen terkait.
            </p>
            <p className="text-xs text-red-600 mb-5">Tindakan ini tidak dapat dibatalkan.</p>
            {hapusMsg && <p className="text-xs text-red-600 mb-3">{hapusMsg}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setHapusRow(null)}
                disabled={hapusSaving}
                className="flex-1 py-2.5 border border-brand-azure/30 text-brand-navy text-sm rounded-lg hover:bg-brand-cream transition-colors disabled:opacity-40"
              >
                Batal
              </button>
              <button
                onClick={konfirmasiHapus}
                disabled={hapusSaving}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                {hapusSaving ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ── Helper ─────────────────────────────────────────────────────────────────

function Field({ label, value, mono, full }: { label: string; value: string; mono?: boolean; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className={`text-slate-800 break-words ${mono ? 'font-mono text-xs' : 'text-sm'}`}>{value}</p>
    </div>
  )
}
