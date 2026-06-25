'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = ['Data Orang Tua', 'Data Siswa', 'Pilih Jalur', 'Upload Dokumen', 'Konfirmasi']

const JALUR_OPTIONS = [
  { value: 'zonasi',   label: 'Jalur Zonasi',            persen: '40% kuota', deskripsi: 'Berbasis jarak domisili ke sekolah' },
  { value: 'prestasi', label: 'Jalur Prestasi',           persen: '30% kuota', deskripsi: 'Nilai rapor atau sertifikat lomba' },
  { value: 'afirmasi', label: 'Jalur Afirmasi',           persen: '20% kuota', deskripsi: 'Keluarga penerima PKH/KIP/DTKS' },
  { value: 'mutasi',   label: 'Jalur Mutasi / Anak Guru', persen: '10% kuota', deskripsi: 'Pindahan atau anak tenaga kependidikan' },
] as const

type NamaJalur = typeof JALUR_OPTIONS[number]['value']

const DOKUMEN_LIST = ['akta', 'skl', 'kk', 'ktp_ayah', 'ktp_ibu'] as const
type JenisDokumen = typeof DOKUMEN_LIST[number]

const LABEL_DOKUMEN: Record<JenisDokumen, string> = {
  akta:     'Akta Kelahiran',
  skl:      'SKL / Surat Keterangan Lulus',
  kk:       'Kartu Keluarga (KK)',
  ktp_ayah: 'KTP Ayah',
  ktp_ibu:  'KTP Ibu',
}

const AGAMA_LIST = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'] as const
type Agama = typeof AGAMA_LIST[number]

const UKURAN_BAJU_LIST = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const
type UkuranBaju = typeof UKURAN_BAJU_LIST[number]

const MAX_FILE_SIZE = 2 * 1024 * 1024
const MIME_OK = ['image/jpeg', 'image/png', 'application/pdf']
const HARI_INI = new Date().toISOString().split('T')[0]

function cekFile(file: File): string | null {
  if (!MIME_OK.includes(file.type)) return 'Gunakan JPG, PNG, atau PDF.'
  if (file.size > MAX_FILE_SIZE) return 'Ukuran maks 2 MB.'
  return null
}

// ── input class ──
const base = 'w-full px-3 py-2 border rounded-lg text-sm bg-white text-brand-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-azure focus:border-transparent'
const inputCls    = base + ' border-brand-azure/30'
const inputClsErr = base + ' border-red-400'

export default function FormPendaftaran() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 1 — Data Orang Tua
  const [namaAyah, setNamaAyah] = useState('')
  const [namaIbu,  setNamaIbu]  = useState('')
  const [nomorWA,  setNomorWA]  = useState('')
  const [alamat,   setAlamat]   = useState('')
  const [errOrtu,  setErrOrtu]  = useState<string[]>([])
  const [submitOrtu, setSubmitOrtu] = useState(false)  // flag: pernah klik Lanjut di step 1

  // Step 2 — Data Siswa
  const [namaLengkap,  setNamaLengkap]  = useState('')
  const [nisn,         setNisn]         = useState('')
  const [nomorKK,      setNomorKK]      = useState('')
  const [tempatLahir,  setTempatLahir]  = useState('')
  const [tanggalLahir, setTanggalLahir] = useState('')
  const [jenisKelamin, setJenisKelamin] = useState<'L' | 'P'>('L')
  const [agama,        setAgama]        = useState<Agama>('Islam')
  const [asalSekolah,  setAsalSekolah]  = useState('')
  const [ukuranBaju,   setUkuranBaju]   = useState<UkuranBaju>('M')
  const [errSiswa,     setErrSiswa]     = useState<string[]>([])
  const [submitSiswa,  setSubmitSiswa]  = useState(false)   // flag: pernah klik Lanjut di step 2

  // Step 3–5
  const [jalur,      setJalur]      = useState<NamaJalur | ''>('')
  const [dokumen,    setDokumen]    = useState<Partial<Record<JenisDokumen, File>>>({})
  const [dokumenErr, setDokumenErr] = useState<Partial<Record<JenisDokumen, string>>>({})
  const [loading,    setLoading]    = useState(false)
  const [errKirim,   setErrKirim]   = useState<string | null>(null)

  // ── Validasi Step 1 ──
  function next1() {
    setSubmitOrtu(true)
    const e: string[] = []
    if (!namaAyah.trim()) e.push('Nama ayah wajib diisi.')
    if (!namaIbu.trim())  e.push('Nama ibu wajib diisi.')
    if (!nomorWA.trim())  e.push('Nomor WhatsApp wajib diisi.')
    else if (!/^[0-9]{8,15}$/.test(nomorWA.trim().replace(/[^0-9]/g, ''))) e.push('Nomor WhatsApp tidak valid (minimal 8 angka).')
    if (!alamat.trim())   e.push('Alamat wajib diisi.')
    setErrOrtu(e)
    if (e.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Validasi Step 2 ──
  function next2() {
    setSubmitSiswa(true)
    const e: string[] = []
    if (!namaLengkap.trim())        e.push('Nama lengkap wajib diisi.')
    if (nisn && nisn.length !== 10) e.push('NISN harus 10 digit (kosongkan jika belum punya NISN).')
    if (!nomorKK)                   e.push('Nomor KK wajib diisi.')
    else if (nomorKK.length !== 16) e.push('Nomor KK harus 16 digit.')
    if (!tempatLahir.trim())        e.push('Tempat lahir wajib diisi.')
    if (!tanggalLahir)              e.push('Tanggal lahir wajib diisi.')
    // asal sekolah opsional — tidak divalidasi
    setErrSiswa(e)
    if (e.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function pilihDokumen(jenis: JenisDokumen, file: File | undefined) {
    if (!file) return
    const err = cekFile(file)
    if (err) { setDokumenErr(p => ({ ...p, [jenis]: err })); return }
    setDokumenErr(p => ({ ...p, [jenis]: undefined }))
    setDokumen(p => ({ ...p, [jenis]: file }))
  }

  async function kirim() {
    setLoading(true)
    setErrKirim(null)
    try {
      const fd = new FormData()
      fd.append('jalur', jalur)
      fd.append('data_orangtua', JSON.stringify({
        nama_ayah: namaAyah.trim(), nama_ibu: namaIbu.trim(),
        nomor_wa: nomorWA.trim(), alamat: alamat.trim(),
      }))
      fd.append('data_siswa', JSON.stringify({
        nisn, nomor_kk: nomorKK, nama_lengkap: namaLengkap.trim(),
        tempat_lahir: tempatLahir.trim(), tanggal_lahir: tanggalLahir,
        jenis_kelamin: jenisKelamin, agama, asal_sekolah: asalSekolah.trim(),
        ukuran_baju: ukuranBaju,
      }))
      DOKUMEN_LIST.forEach(j => { const f = dokumen[j]; if (f) fd.append(j, f) })
      const res  = await fetch('/api/pendaftaran', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.success) {
        router.push(`/daftar/sukses?nomor=${encodeURIComponent(json.data.nomor_pendaftaran)}`)
      } else {
        setErrKirim(json.message || 'Terjadi kesalahan.')
      }
    } catch {
      setErrKirim('Gagal mengirim. Periksa koneksi internet.')
    } finally {
      setLoading(false)
    }
  }

  const dokumenLengkap = DOKUMEN_LIST.every(j => dokumen[j])

  // ── helper: apakah field siswa punya error ──
  const siswaErr = (cond: boolean) => submitSiswa && cond ? inputClsErr : inputCls

  return (
    <div>

      {/* ── Step bar ── */}
      <div className="flex items-center mb-8 overflow-x-auto pb-1">
        {STEPS.map((label, i) => {
          const idx = i + 1
          const done = idx < step
          const active = idx === step
          return (
            <div key={i} className="flex items-center flex-1 last:flex-none min-w-[58px]">
              <div className="flex flex-col items-center">
                <div className={[
                  'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium',
                  (done || active) ? 'bg-brand-navy text-white' : 'bg-brand-cream text-slate-400',
                  active ? 'ring-4 ring-brand-sky/40' : '',
                ].join(' ')}>
                  {done ? '✓' : idx}
                </div>
                <span className={['mt-1 text-[10px] sm:text-xs text-center max-w-[60px]', active ? 'text-brand-navy font-medium' : 'text-slate-400'].join(' ')}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={['flex-1 h-px mx-1 sm:mx-2 mb-5', done ? 'bg-brand-navy' : 'bg-brand-azure/20'].join(' ')} />
              )}
            </div>
          )
        })}
      </div>

      {/* ── Step 1: Data Orang Tua ── */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-brand-azure/15 p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-brand-navy">Data orang tua / wali</h2>
            <p className="text-xs text-slate-400">Langkah 1 dari 5 — semua field wajib diisi</p>
          </div>

          {errOrtu.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1">
              {errOrtu.map((e, i) => (
                <p key={i} className="text-sm text-red-700">⚠ {e}</p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-navy mb-1">Nama lengkap ayah <span className="text-red-500">*</span></label>
              <input
                className={submitOrtu && !namaAyah.trim() ? inputClsErr : inputCls}
                value={namaAyah}
                onChange={e => setNamaAyah(e.target.value)}
                placeholder="Sesuai KTP"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-navy mb-1">Nama lengkap ibu <span className="text-red-500">*</span></label>
              <input
                className={submitOrtu && !namaIbu.trim() ? inputClsErr : inputCls}
                value={namaIbu}
                onChange={e => setNamaIbu(e.target.value)}
                placeholder="Sesuai KTP"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-navy mb-1">Nomor WhatsApp aktif <span className="text-red-500">*</span></label>
            <input
              className={submitOrtu && !nomorWA.trim() ? inputClsErr : inputCls}
              type="tel"
              value={nomorWA}
              onChange={e => setNomorWA(e.target.value)}
              placeholder="08123456789"
            />
            <p className="mt-1 text-xs text-slate-500">Nomor pendaftaran dikirim ke sini</p>
            {submitOrtu && errOrtu.some(e => e.includes('WhatsApp')) && (
              <p className="mt-1 text-xs text-red-600">⚠ {errOrtu.find(e => e.includes('WhatsApp'))}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-navy mb-1">Alamat lengkap <span className="text-red-500">*</span></label>
            <textarea
              className={[
                'w-full px-3 py-2 border rounded-lg text-sm bg-white text-brand-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-azure resize-none',
                submitOrtu && !alamat.trim() ? 'border-red-400' : 'border-brand-azure/30',
              ].join(' ')}
              rows={3}
              value={alamat}
              onChange={e => setAlamat(e.target.value)}
              placeholder="Jalan, RT/RW, kelurahan, kecamatan, kota"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={next1}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium bg-brand-navy text-white hover:bg-brand-navy-dark transition-colors"
            >
              Lanjut ke data siswa →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Data Siswa ── */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-brand-azure/15 p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-brand-navy">Data calon siswa</h2>
            <p className="text-xs text-slate-400">Langkah 2 dari 5</p>
          </div>

          {errSiswa.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1">
              {errSiswa.map((e, i) => (
                <p key={i} className="text-sm text-red-700">⚠ {e}</p>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-brand-navy mb-1">Nama lengkap siswa <span className="text-red-500">*</span></label>
            <input
              className={siswaErr(!namaLengkap.trim())}
              value={namaLengkap}
              onChange={e => setNamaLengkap(e.target.value)}
              placeholder="Sesuai akta kelahiran"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-navy mb-1">NISN <span className="text-red-500">*</span></label>
              <input
                className={siswaErr(!nisn || nisn.length !== 10)}
                value={nisn}
                onChange={e => setNisn(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10 digit NISN"
              />
              <p className="mt-1 text-xs text-slate-500">{nisn.length}/10 digit</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-navy mb-1">Nomor KK <span className="text-red-500">*</span></label>
              <input
                className={siswaErr(!nomorKK || nomorKK.length !== 16)}
                value={nomorKK}
                onChange={e => setNomorKK(e.target.value.replace(/\D/g, '').slice(0, 16))}
                placeholder="16 digit nomor KK"
              />
              <p className="mt-1 text-xs text-slate-500">{nomorKK.length}/16 digit</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-navy mb-1">Tempat lahir <span className="text-red-500">*</span></label>
              <input
                className={siswaErr(!tempatLahir.trim())}
                value={tempatLahir}
                onChange={e => setTempatLahir(e.target.value)}
                placeholder="cth: Bagan Sinembah"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-navy mb-1">Tanggal lahir <span className="text-red-500">*</span></label>
              <input
                className={siswaErr(!tanggalLahir)}
                type="date"
                value={tanggalLahir}
                max={HARI_INI}
                onChange={e => setTanggalLahir(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-navy mb-1">Jenis kelamin <span className="text-red-500">*</span></label>
              <select className={inputCls} value={jenisKelamin} onChange={e => setJenisKelamin(e.target.value as 'L' | 'P')}>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-navy mb-1">Agama <span className="text-red-500">*</span></label>
              <select className={inputCls} value={agama} onChange={e => setAgama(e.target.value as Agama)}>
                {AGAMA_LIST.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-navy mb-1">Asal sekolah (SD) <span className="text-slate-400 font-normal text-xs ml-1">opsional</span></label>
            <input
              className={inputCls}
              value={asalSekolah}
              onChange={e => setAsalSekolah(e.target.value)}
              placeholder="Nama SD asal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-navy mb-1">
              Ukuran baju <span className="text-red-500">*</span>
              <span className="text-slate-400 font-normal text-xs ml-1">(untuk keperluan seragam)</span>
            </label>
            <div className="flex flex-wrap gap-2 mt-1">
              {UKURAN_BAJU_LIST.map(ukuran => (
                <button
                  key={ukuran}
                  type="button"
                  onClick={() => setUkuranBaju(ukuran)}
                  className={[
                    'px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-colors',
                    ukuranBaju === ukuran
                      ? 'border-brand-navy bg-brand-navy text-white'
                      : 'border-brand-azure/30 text-brand-navy hover:border-brand-azure bg-white',
                  ].join(' ')}
                >
                  {ukuran}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Pilihan ukuran: S (30–32), M (34–36), L (38–40), XL (42–44), XXL (46–48), XXXL (50+)</p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium bg-white text-brand-navy border border-brand-azure/30 hover:bg-brand-cream transition-colors"
            >
              ← Kembali
            </button>
            <button
              type="button"
              onClick={next2}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium bg-brand-navy text-white hover:bg-brand-navy-dark transition-colors"
            >
              Lanjut pilih jalur →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Pilih Jalur ── */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-brand-azure/15 p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-brand-navy">Pilih jalur pendaftaran</h2>
            <p className="text-xs text-slate-400">Langkah 3 dari 5</p>
          </div>
          <div className="flex flex-col gap-3">
            {JALUR_OPTIONS.map(j => (
              <label key={j.value} className={['flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors', jalur === j.value ? 'border-brand-navy bg-brand-sky/15' : 'border-brand-azure/15 hover:border-brand-azure'].join(' ')}>
                <input type="radio" name="jalur" value={j.value} checked={jalur === j.value} onChange={() => setJalur(j.value)} className="mt-0.5 accent-brand-navy" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-semibold text-brand-navy">{j.label}</span>
                    <span className="text-xs bg-brand-sky/30 text-brand-navy px-2 py-0.5 rounded-full">{j.persen}</span>
                  </div>
                  <p className="text-xs text-slate-500">{j.deskripsi}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-2">
            <button type="button" onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium bg-white text-brand-navy border border-brand-azure/30 hover:bg-brand-cream transition-colors">← Kembali</button>
            <button
              type="button"
              onClick={() => { if (jalur) { setStep(4); window.scrollTo({ top: 0, behavior: 'smooth' }) } }}
              className={['inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors', jalur ? 'bg-brand-navy text-white hover:bg-brand-navy-dark' : 'bg-brand-cream text-slate-400 cursor-not-allowed'].join(' ')}
            >
              Lanjut upload dokumen →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Upload Dokumen ── */}
      {step === 4 && (
        <div className="bg-white rounded-xl border border-brand-azure/15 p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-brand-navy">Upload dokumen</h2>
            <p className="text-xs text-slate-400">Langkah 4 dari 5 — semua dokumen wajib diupload</p>
          </div>
          <div className="flex flex-col gap-3">
            {DOKUMEN_LIST.map(jenis => {
              const file = dokumen[jenis]
              const err = dokumenErr[jenis]
              return (
                <div key={jenis}>
                  <label className={['flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors', file ? 'border-green-200 bg-green-50' : err ? 'border-red-200' : 'border-dashed border-brand-azure/30 hover:border-brand-azure'].join(' ')}>
                    <div className={['w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', file ? 'bg-green-100' : 'bg-brand-cream'].join(' ')}>
                      {file
                        ? <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        : <svg className="w-5 h-5 text-brand-azure" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={['text-sm font-medium', file ? 'text-green-800' : 'text-brand-navy'].join(' ')}>{LABEL_DOKUMEN[jenis]}</p>
                      <p className={['text-xs truncate', file ? 'text-green-600' : 'text-slate-400'].join(' ')}>
                        {file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB` : 'Klik untuk pilih · JPG, PNG, atau PDF maks. 2 MB'}
                      </p>
                    </div>
                    <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={e => pilihDokumen(jenis, e.target.files?.[0])} />
                  </label>
                  {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
                </div>
              )
            })}
          </div>
          {!dokumenLengkap && (
            <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
              ⚠ {DOKUMEN_LIST.filter(j => !dokumen[j]).length} dokumen belum diupload
            </p>
          )}
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-2">
            <button type="button" onClick={() => { setStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium bg-white text-brand-navy border border-brand-azure/30 hover:bg-brand-cream transition-colors">← Kembali</button>
            <button
              type="button"
              onClick={() => { if (dokumenLengkap) { setStep(5); window.scrollTo({ top: 0, behavior: 'smooth' }) } }}
              className={['inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors', dokumenLengkap ? 'bg-brand-navy text-white hover:bg-brand-navy-dark' : 'bg-brand-cream text-slate-400 cursor-not-allowed'].join(' ')}
            >
              Lanjut konfirmasi →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 5: Konfirmasi ── */}
      {step === 5 && (
        <div className="bg-white rounded-xl border border-brand-azure/15 p-4 sm:p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-brand-navy">Konfirmasi & kirim</h2>
            <p className="text-xs text-slate-400">Periksa kembali data sebelum mengirim</p>
          </div>
          {[
            { judul: 'Data Orang Tua', rows: [['Nama Ayah', namaAyah], ['Nama Ibu', namaIbu], ['WhatsApp', nomorWA], ['Alamat', alamat]] as [string,string][] },
            { judul: 'Data Siswa',     rows: [['Nama Lengkap', namaLengkap], ['NISN', nisn], ['Nomor KK', nomorKK], ['Tempat Lahir', tempatLahir], ['Asal Sekolah', asalSekolah || '-'], ['Ukuran Baju', ukuranBaju], ['Jalur', JALUR_OPTIONS.find(j => j.value === jalur)?.label ?? '-']] as [string,string][] },
          ].map(({ judul, rows }) => (
            <div key={judul}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{judul}</p>
              <div className="rounded-lg bg-brand-cream border border-brand-azure/15 p-4 space-y-2">
                {rows.map(([label, nilai]) => (
                  <div key={label} className="flex flex-col sm:flex-row sm:gap-2 text-sm">
                    <span className="text-slate-500 sm:w-28 sm:flex-shrink-0">{label}</span>
                    <span className="text-brand-navy font-medium break-words">{nilai}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Dokumen</p>
            <div className="rounded-lg bg-brand-cream border border-brand-azure/15 p-4 space-y-1">
              {DOKUMEN_LIST.map(jenis => (
                <div key={jenis} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-slate-600">{LABEL_DOKUMEN[jenis]}</span>
                  <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded flex-shrink-0">✓ Terupload</span>
                </div>
              ))}
            </div>
          </div>
          {errKirim && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">⚠ {errKirim}</p>}
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-2">
            <button type="button" onClick={() => { setStep(4); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium bg-white text-brand-navy border border-brand-azure/30 hover:bg-brand-cream transition-colors">← Kembali</button>
            <button
              type="button"
              onClick={kirim}
              disabled={loading}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium bg-brand-navy text-white hover:bg-brand-navy-dark disabled:opacity-50 transition-colors"
            >
              {loading ? 'Mengirim...' : 'Kirim Pendaftaran'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
