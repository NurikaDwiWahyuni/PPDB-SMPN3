import type { Metadata } from 'next'
import Link from 'next/link'
import { NavbarPublik, LogoSekolah } from '@/app/_components/ui'
import CekPengumuman from './_components/CekPengumuman'
import { AnimasiMasuk, AnimasiTeks, AnimasiAngka } from './_components/animasi'

export const metadata: Metadata = {
  title: 'SPMB 2026/2027 — SMP Negeri 3 Bagan Sinembah',
  description: 'Penerimaan Peserta Didik Baru SMP Negeri 3 Bagan Sinembah Tahun Ajaran 2026/2027.',
}

// ── Data ──────────────────────────────────────────────────────────────────

const jadwal = [
  {
    no: 1,
    kegiatan: 'Sosialisasi SPMB',
    tanggal: '06 April 2026' as string | null,
    gelombang: null as null | { label: string; tanggal: string }[],
    status: 'selesai' as const,
  },
  {
    no: 2,
    kegiatan: 'Pendaftaran',
    tanggal: null,
    gelombang: [
      { label: 'Gelombang I — Jalur Afirmasi, Prestasi, dan Mutasi', tanggal: '25 s.d. 27 Juni 2026' },
      { label: 'Gelombang II — Jalur Domisili',                       tanggal: '29 Juni s.d. 01 Juli 2026' },
    ],
    status: 'aktif' as const,
  },
  {
    no: 3,
    kegiatan: 'Pengumuman SPMB',
    tanggal: '02 Juli 2026',
    gelombang: null,
    status: 'mendatang' as const,
  },
  {
    no: 4,
    kegiatan: 'Daftar Ulang',
    tanggal: '03 s.d. 04 Juli 2026',
    gelombang: null,
    status: 'mendatang' as const,
  },
  {
    no: 5,
    kegiatan: 'Hari Pertama Masuk Sekolah dan Pengenalan Lingkungan Sekolah',
    tanggal: '06 Juli 2026',
    gelombang: null,
    status: 'mendatang' as const,
  },
]

const jalur = [
  { nama: 'Jalur Domisili', kuota: 128, ikon: '🏠', deskripsi: 'Seleksi berdasarkan domisili calon peserta didik sesuai ketentuan yang berlaku.' },
  { nama: 'Jalur Prestasi', kuota: 77,  ikon: '🏆', deskripsi: 'Diperuntukkan bagi calon peserta didik yang memiliki prestasi akademik maupun non-akademik.' },
  { nama: 'Jalur Afirmasi', kuota: 38,  ikon: '🤝', deskripsi: 'Diperuntukkan bagi calon peserta didik dari keluarga kurang mampu atau kategori tertentu.' },
  { nama: 'Jalur Mutasi',   kuota: 13,  ikon: '🔄', deskripsi: 'Diperuntukkan bagi calon peserta didik yang mengikuti perpindahan tugas orang tua / anak guru.' },
]

const dokumenWajib = [
  { nama: 'Kartu Keluarga (KK)',          keterangan: 'Format JPG, PNG, atau PDF, maks. 2 MB.' },
  { nama: 'Akta Kelahiran',               keterangan: 'Dokumen harus terbaca dengan jelas.' },
  { nama: 'Surat Keterangan Lulus (SKL)', keterangan: 'Diterbitkan oleh sekolah asal.' },
  { nama: 'KTP Ayah',                     keterangan: 'Format JPG, PNG, atau PDF.' },
  { nama: 'KTP Ibu',                      keterangan: 'Format JPG, PNG, atau PDF.' },
]

// ── Halaman ──────────────────────────────────────────────────────────────

export default function BerandaPage() {
  const totalKuota = jalur.reduce((s, j) => s + j.kuota, 0)

  return (
    <div className="min-h-screen bg-brand-cream">
      <NavbarPublik />

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-brand-navy-darker via-brand-navy to-brand-azure text-white overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 md:py-24">
          <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-10">
            <div className="flex-1">
              <AnimasiMasuk delay={0}>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium text-brand-sky mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Pendaftaran Sedang Dibuka
                </div>
              </AnimasiMasuk>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-3">
                <AnimasiTeks
                  teks="SPMB SMP Negeri 3 Bagan Sinembah"
                  tag="span"
                  per="kata"
                  delay={80}
                  className="block"
                />
              </h1>

              <AnimasiMasuk delay={400}>
                <p className="text-brand-sky text-base mb-2">Tahun Ajaran 2026/2027</p>
              </AnimasiMasuk>

              <AnimasiMasuk delay={500}>
                <p className="text-white/80 text-sm max-w-lg mb-8 leading-relaxed">
                  Pendaftaran dilakukan secara online. Mudah, cepat, dan transparan.
                  Daftarkan putra-putri Anda sebelum 27 Juni 2026 (Gelombang I) atau 1 Juli 2026 (Gelombang II).
                </p>
              </AnimasiMasuk>

              <AnimasiMasuk delay={620}>
                <div className="flex flex-wrap gap-3">
                  <Link href="/daftar"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-brand-navy text-sm font-bold hover:bg-brand-sky/30 transition-colors shadow-lg">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Daftar Sekarang
                  </Link>
                  <Link href="/status"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/25 text-white text-sm font-medium hover:bg-white/20 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Cek Status
                  </Link>
                </div>
              </AnimasiMasuk>
            </div>

            {/* Statistik */}
            <div className="grid grid-cols-2 gap-3 sm:max-w-sm md:w-72 md:max-w-none">
              {[
                { label: 'Total Kuota',   nilai: totalKuota, sub: 'kursi tersedia',    angka: true,  delay: 300 },
                { label: 'Jalur Dibuka', nilai: 4,           sub: 'jalur pendaftaran', angka: true,  delay: 400 },
                { label: 'Pengumuman',   nilai: '02 Jul',    sub: 'hasil seleksi',     angka: false, delay: 500 },
                { label: 'Daftar Ulang', nilai: '03–04 Jul', sub: 'setelah pengumuman',angka: false, delay: 600 },
              ].map((s) => (
                <AnimasiMasuk key={s.label} delay={s.delay}>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                    <p className="text-xl sm:text-2xl font-bold text-white">
                      {s.angka && typeof s.nilai === 'number'
                        ? <AnimasiAngka nilai={s.nilai} delay={s.delay + 100} />
                        : s.nilai}
                    </p>
                    <p className="text-xs font-medium text-brand-sky mt-0.5">{s.label}</p>
                    <p className="text-xs text-white/60 mt-0.5">{s.sub}</p>
                  </div>
                </AnimasiMasuk>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Jadwal ── */}
      <section id="jadwal" className="scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
          <AnimasiMasuk>
            <SectionHeader title="Jadwal SPMB 2026/2027" sub="Tahapan pelaksanaan penerimaan peserta didik baru" />
          </AnimasiMasuk>
          <AnimasiMasuk delay={80}>
            <div className="bg-white rounded-2xl border border-brand-azure/20 shadow-sm overflow-hidden">

              {/* Header tabel — desktop */}
              <div className="hidden sm:grid grid-cols-[3rem_1fr_auto_auto] gap-4 px-5 py-3 bg-brand-cream border-b border-brand-azure/15 text-xs font-semibold text-brand-navy/60 uppercase tracking-wide">
                <span>No</span>
                <span>Kegiatan</span>
                <span>Tanggal</span>
                <span>Status</span>
              </div>

              {jadwal.map((j, i) => {
                const badgeClass =
                  j.status === 'aktif'     ? 'bg-green-50 text-green-700 border border-green-200' :
                  j.status === 'selesai'   ? 'bg-brand-cream text-brand-navy/50' :
                                             'bg-brand-cream text-brand-navy/40'
                const badgeLabel =
                  j.status === 'aktif'   ? 'Berlangsung' :
                  j.status === 'selesai' ? 'Selesai' : 'Mendatang'
                const dotClass =
                  j.status === 'aktif'   ? 'bg-green-500' :
                  j.status === 'selesai' ? 'bg-brand-azure' : 'bg-brand-azure/30'

                return (
                  <div key={j.no} className={i < jadwal.length - 1 ? 'border-b border-brand-cream' : ''}>
                    {/* Baris utama */}
                    <div className="grid grid-cols-[3rem_1fr] sm:grid-cols-[3rem_1fr_auto_auto] items-start gap-x-4 gap-y-1 px-5 py-4">
                      {/* No + dot */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
                        <span className="text-sm font-semibold text-brand-navy/40">{j.no}</span>
                      </div>

                      {/* Kegiatan */}
                      <div>
                        <p className="text-sm font-semibold text-brand-navy">{j.kegiatan}</p>
                        {/* Tanggal mobile */}
                        {j.tanggal && (
                          <p className="text-xs text-brand-navy/50 mt-0.5 sm:hidden">{j.tanggal}</p>
                        )}
                        {j.gelombang && (
                          <p className="text-xs text-brand-navy/40 mt-0.5 sm:hidden">Lihat rincian di bawah</p>
                        )}
                      </div>

                      {/* Tanggal desktop */}
                      <div className="hidden sm:block text-right min-w-[170px]">
                        {j.tanggal && (
                          <p className="text-sm text-brand-navy/70">{j.tanggal}</p>
                        )}
                      </div>

                      {/* Badge desktop */}
                      <div className="hidden sm:flex justify-end">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                      </div>

                      {/* Badge mobile */}
                      <div className="sm:hidden col-start-2 flex justify-end -mt-6">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                      </div>
                    </div>

                    {/* Sub-gelombang */}
                    {j.gelombang && (
                      <div className="px-5 pb-4 space-y-2 pl-[3.75rem]">
                        {j.gelombang.map((g, gi) => (
                          <div key={gi} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded-xl bg-brand-sky/20 border border-brand-azure/20 px-4 py-2.5">
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-bold text-brand-navy mt-0.5">{gi + 1}.</span>
                              <p className="text-xs font-medium text-brand-navy">{g.label}</p>
                            </div>
                            <p className="text-xs text-brand-navy font-semibold whitespace-nowrap sm:ml-4">{g.tanggal}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </AnimasiMasuk>
        </div>
      </section>

      {/* ── Jalur Pendaftaran ── */}
      <section id="jalur" className="bg-white border-y border-brand-azure/15 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
          <AnimasiMasuk>
            <SectionHeader title="Jalur Pendaftaran" sub="Pilih jalur yang sesuai dengan kondisi calon peserta didik" />
          </AnimasiMasuk>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {jalur.map((j, i) => (
              <AnimasiMasuk key={i} delay={i * 80}>
                <div className="bg-brand-cream rounded-2xl border border-brand-azure/20 p-5 hover:border-brand-azure hover:bg-brand-sky/15 transition-colors group h-full">
                  <div className="text-3xl mb-3">{j.ikon}</div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold text-brand-navy group-hover:text-brand-navy-darker">{j.nama}</h3>
                    <span className="flex-shrink-0 ml-2 text-xs font-bold bg-brand-sky/40 text-brand-navy px-2 py-0.5 rounded-full">
                      <AnimasiAngka nilai={j.kuota} delay={i * 80 + 200} />
                    </span>
                  </div>
                  <p className="text-xs text-brand-navy/60 leading-relaxed">{j.deskripsi}</p>
                </div>
              </AnimasiMasuk>
            ))}
          </div>
          <AnimasiMasuk delay={400}>
            <p className="text-center text-xs text-brand-navy/50 mt-4">
              Total kuota: <strong className="text-brand-navy">{totalKuota} siswa</strong>
            </p>
            <div className="mt-6 text-center">
              <Link href="/daftar"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-navy text-white text-sm font-semibold hover:bg-brand-navy-darker transition-colors">
                Mulai Pendaftaran
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </AnimasiMasuk>
        </div>
      </section>

      {/* ── Persyaratan ── */}
      <section id="persyaratan" className="scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
          <AnimasiMasuk>
            <SectionHeader title="Persyaratan Pendaftaran" sub="Siapkan semua dokumen berikut sebelum mendaftar" />
          </AnimasiMasuk>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {dokumenWajib.map((d, i) => (
              <AnimasiMasuk key={i} delay={i * 70}>
                <div className="flex items-start gap-3 rounded-xl border border-brand-azure/20 p-4 bg-white shadow-sm h-full">
                  <div className="w-9 h-9 rounded-lg bg-brand-sky/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-brand-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-navy">{d.nama}</p>
                    <p className="text-xs text-brand-navy/50 mt-0.5">{d.keterangan}</p>
                  </div>
                </div>
              </AnimasiMasuk>
            ))}
          </div>
          <AnimasiMasuk delay={380}>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                Ketentuan Umum
              </p>
              <ul className="text-xs text-amber-800 space-y-1.5 list-disc list-inside">
                <li>Calon peserta didik merupakan lulusan SD/MI atau sederajat.</li>
                <li>Memiliki NISN yang valid dan terdaftar di Dapodik.</li>
                <li>Setiap calon peserta didik hanya dapat melakukan satu kali pendaftaran.</li>
                <li>Dokumen yang diunggah harus sesuai dengan data asli.</li>
                <li>Pemalsuan dokumen akan mengakibatkan pembatalan pendaftaran.</li>
              </ul>
            </div>
          </AnimasiMasuk>
        </div>
      </section>

      {/* ── Pengumuman ── */}
      <section id="pengumuman" className="bg-white border-t border-brand-azure/15 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
          <AnimasiMasuk>
            <SectionHeader title="Cek Pengumuman Hasil Seleksi" sub="Masukkan NISN atau nomor pendaftaran untuk melihat hasil seleksi" />
          </AnimasiMasuk>
          <AnimasiMasuk delay={100}>
            <CekPengumuman />
          </AnimasiMasuk>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-brand-navy-darker text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <AnimasiMasuk>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10 mb-8">
              <div className="flex items-center gap-3">
                <LogoSekolah size={44} />
                <div>
                  <p className="font-bold text-white">SMP Negeri 3 Bagan Sinembah</p>
                  <p className="text-xs text-white/50 mt-0.5">Bagan Sinembah, Rokan Hilir, Riau</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-5 text-sm text-white/60 sm:ml-auto">
                <Link href="/daftar"      className="hover:text-white transition-colors">Pendaftaran</Link>
                <Link href="/status"      className="hover:text-white transition-colors">Cek Status</Link>
                <Link href="/#pengumuman" className="hover:text-white transition-colors">Pengumuman</Link>
              </div>
            </div>
          </AnimasiMasuk>
          <div className="border-t border-white/10 pt-6 text-center text-xs text-white/40">
            © 2026 SPMB SMP Negeri 3 Bagan Sinembah. Sistem Penerimaan Murid Baru.
          </div>
        </div>
      </footer>
    </div>
  )
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-bold text-brand-navy">{title}</h2>
      <p className="text-sm text-brand-navy/60 mt-1">{sub}</p>
    </div>
  )
}
