'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const JALUR_OPTS = [
  { value: 'zonasi',   label: 'Jalur Zonasi' },
  { value: 'prestasi', label: 'Jalur Prestasi' },
  { value: 'afirmasi', label: 'Jalur Afirmasi' },
  { value: 'mutasi',   label: 'Jalur Mutasi / Anak Guru' },
]

const AGAMA_OPTS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu']

const HASIL_OPTS = [
  { value: '',               label: 'Belum ditentukan (Terverifikasi)' },
  { value: 'diterima',       label: 'Langsung Diterima' },
  { value: 'tidak_diterima', label: 'Tidak Diterima' },
]

const EMPTY = {
  jalur: '', nama_lengkap: '', nisn: '', nomor_kk: '',
  tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: '', agama: '', asal_sekolah: '',
  nama_ayah: '', nama_ibu: '', nomor_wa: '', alamat: '',
  hasil: '', catatan_hasil: '',
}

export default function TambahOfflinePage() {
  const router = useRouter()
  const [form, setForm]     = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState('')
  const [sukses, setSukses] = useState('')

  function set(k: string, v: string) {
    setForm(p => ({ ...p, [k]: v }))
    setErr('')
  }

  async function submit() {
    const wajib: [string, string][] = [
      ['jalur',         'Jalur pendaftaran'],
      ['nama_lengkap',  'Nama lengkap'],
      ['nomor_kk',      'Nomor KK'],
      ['tempat_lahir',  'Tempat lahir'],
      ['tanggal_lahir', 'Tanggal lahir'],
      ['jenis_kelamin', 'Jenis kelamin'],
      ['agama',         'Agama'],
      ['nama_ayah',     'Nama ayah'],
      ['nama_ibu',      'Nama ibu'],
      ['nomor_wa',      'Nomor WhatsApp'],
      ['alamat',        'Alamat'],
    ]
    for (const [k, label] of wajib) {
      if (!form[k as keyof typeof form].trim()) {
        setErr(`${label} wajib diisi.`)
        return
      }
    }
    if (form.nisn && !/^\d{10}$/.test(form.nisn.trim())) {
      setErr('NISN harus 10 digit angka.')
      return
    }
    if (!/^\d{16}$/.test(form.nomor_kk.trim())) {
      setErr('Nomor KK harus 16 digit angka.')
      return
    }

    setSaving(true)
    setErr('')
    setSukses('')

    const res  = await fetch('/api/admin/pendaftaran/offline', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        ...form,
        nisn:  form.nisn.trim() || null,
        hasil: form.hasil || undefined,
      }),
    })
    const json = await res.json()
    setSaving(false)

    if (json.success) {
      setSukses(json.message)
      setForm({ ...EMPTY })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setErr(json.message)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl">

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button onClick={() => router.push('/admin/pendaftaran')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-navy mb-4 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Data Pendaftar
          </button>
          <h1 className="text-xl sm:text-2xl font-semibold text-brand-navy">Tambah Pendaftar Offline</h1>
          <p className="text-sm text-slate-500 mt-1">Input data siswa yang mendaftar secara langsung (tidak melalui website).</p>
        </div>

        {/* Notif sukses */}
        {sukses && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-800">{sukses}</p>
              <p className="text-xs text-green-600 mt-0.5">Form sudah dikosongkan, siap untuk input berikutnya.</p>
            </div>
          </div>
        )}

        {/* Error */}
        {err && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{err}</p>
          </div>
        )}

        <div className="space-y-5">

          {/* ── Jalur ── */}
          <div className="bg-white rounded-2xl border border-brand-azure/15 p-5 sm:p-6">
            <p className="text-sm font-semibold text-brand-navy mb-4">Jalur Pendaftaran</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {JALUR_OPTS.map((j) => (
                <button key={j.value} type="button" onClick={() => set('jalur', j.value)}
                  className={`px-4 py-3 text-sm font-medium rounded-xl border transition-all text-left ${
                    form.jalur === j.value
                      ? 'bg-brand-navy text-white border-brand-navy'
                      : 'border-brand-azure/30 text-brand-navy hover:border-brand-azure hover:bg-brand-cream'
                  }`}>
                  {j.label}
                </button>
              ))}
            </div>
            {!form.jalur && <p className="text-xs text-slate-400 mt-2">Pilih salah satu jalur di atas <span className="text-red-400">*</span></p>}
          </div>

          {/* ── Data Siswa ── */}
          <div className="bg-white rounded-2xl border border-brand-azure/15 p-5 sm:p-6">
            <p className="text-sm font-semibold text-brand-navy mb-5">Data Siswa</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">

              <div className="sm:col-span-2">
                <Label>Nama Lengkap <Req /></Label>
                <input value={form.nama_lengkap} onChange={e => set('nama_lengkap', e.target.value)}
                  placeholder="Sesuai akta kelahiran" className={inp} />
              </div>

              <div>
                <Label>NISN</Label>
                <input value={form.nisn} onChange={e => set('nisn', e.target.value)}
                  placeholder="10 digit (kosongkan jika belum ada)" maxLength={10} className={inp} />
              </div>

              <div>
                <Label>Nomor KK <Req /></Label>
                <input value={form.nomor_kk} onChange={e => set('nomor_kk', e.target.value)}
                  placeholder="16 digit angka" maxLength={16} className={inp} />
              </div>

              <div>
                <Label>Tempat Lahir <Req /></Label>
                <input value={form.tempat_lahir} onChange={e => set('tempat_lahir', e.target.value)}
                  placeholder="Kota / Kabupaten" className={inp} />
              </div>

              <div>
                <Label>Tanggal Lahir <Req /></Label>
                <input type="date" value={form.tanggal_lahir} onChange={e => set('tanggal_lahir', e.target.value)} className={inp} />
              </div>

              <div>
                <Label>Jenis Kelamin <Req /></Label>
                <div className="flex gap-2 mt-1.5">
                  {[{v:'L',l:'Laki-laki'},{v:'P',l:'Perempuan'}].map(o => (
                    <button key={o.v} type="button" onClick={() => set('jenis_kelamin', o.v)}
                      className={`flex-1 py-2.5 text-sm rounded-lg border transition-all font-medium ${
                        form.jenis_kelamin === o.v
                          ? 'bg-brand-navy text-white border-brand-navy'
                          : 'border-brand-azure/30 text-brand-navy hover:border-brand-azure hover:bg-brand-cream'
                      }`}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Agama <Req /></Label>
                <select value={form.agama} onChange={e => set('agama', e.target.value)} className={inp}>
                  <option value="">-- Pilih Agama --</option>
                  {AGAMA_OPTS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <Label>Asal Sekolah</Label>
                <input value={form.asal_sekolah} onChange={e => set('asal_sekolah', e.target.value)}
                  placeholder="Nama SD / MI asal (opsional)" className={inp} />
              </div>

            </div>
          </div>

          {/* ── Data Orang Tua ── */}
          <div className="bg-white rounded-2xl border border-brand-azure/15 p-5 sm:p-6">
            <p className="text-sm font-semibold text-brand-navy mb-5">Data Orang Tua / Wali</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">

              <div>
                <Label>Nama Ayah <Req /></Label>
                <input value={form.nama_ayah} onChange={e => set('nama_ayah', e.target.value)} className={inp} />
              </div>

              <div>
                <Label>Nama Ibu <Req /></Label>
                <input value={form.nama_ibu} onChange={e => set('nama_ibu', e.target.value)} className={inp} />
              </div>

              <div>
                <Label>Nomor WhatsApp <Req /></Label>
                <input value={form.nomor_wa} onChange={e => set('nomor_wa', e.target.value)}
                  placeholder="08xxxxxxxxxx" className={inp} />
              </div>

              <div className="sm:col-span-2">
                <Label>Alamat Lengkap <Req /></Label>
                <textarea value={form.alamat} onChange={e => set('alamat', e.target.value)}
                  rows={3} placeholder="Alamat sesuai Kartu Keluarga"
                  className={`${inp} resize-none`} />
              </div>

            </div>
          </div>

          {/* ── Hasil Seleksi ── */}
          <div className="bg-white rounded-2xl border border-brand-azure/15 p-5 sm:p-6">
            <p className="text-sm font-semibold text-brand-navy mb-1">Hasil Seleksi</p>
            <p className="text-xs text-slate-400 mb-4">Bisa diputuskan nanti dari halaman Data Pendaftar.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {HASIL_OPTS.map(o => (
                <button key={o.value} type="button" onClick={() => set('hasil', o.value)}
                  className={`px-3 py-3 text-xs font-medium rounded-xl border transition-all text-left leading-snug ${
                    form.hasil === o.value
                      ? o.value === 'diterima'
                        ? 'bg-green-600 text-white border-green-600'
                        : o.value === 'tidak_diterima'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-brand-navy text-white border-brand-navy'
                      : 'border-brand-azure/30 text-brand-navy hover:border-brand-azure hover:bg-brand-cream'
                  }`}>
                  {o.label}
                </button>
              ))}
            </div>
            {form.hasil && (
              <div className="mt-4">
                <Label>Catatan Hasil</Label>
                <input value={form.catatan_hasil} onChange={e => set('catatan_hasil', e.target.value)}
                  placeholder="Catatan tambahan (opsional)" className={inp} />
              </div>
            )}
          </div>

        </div>

        {/* Tombol */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 pb-8">
          <button onClick={() => router.push('/admin/pendaftaran')}
            className="px-6 py-3 border border-brand-azure/30 text-brand-navy text-sm font-medium rounded-xl hover:bg-brand-cream transition-colors sm:w-auto">
            Batal
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-3 bg-brand-navy text-white text-sm font-semibold rounded-xl hover:bg-brand-navy-dark disabled:opacity-40 transition-colors">
            {saving ? 'Menyimpan...' : 'Simpan Pendaftar Offline'}
          </button>
        </div>

      </div>
    </div>
  )
}

// ── Helper ──────────────────────────────────────────────────────────────────

const inp = 'w-full mt-1.5 px-3 py-2.5 border border-brand-azure/30 rounded-lg text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-azure bg-white placeholder-slate-400 transition-shadow'

function Req() {
  return <span className="text-red-400 ml-0.5">*</span>
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-slate-600">{children}</p>
}
