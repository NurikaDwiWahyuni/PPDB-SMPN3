// ─── Konstanta label & warna ───

import type { StatusPendaftaran, NamaJalur, StatusDokumen, JenisDokumen } from './types'

export const LABEL_STATUS: Record<StatusPendaftaran, string> = {
  menunggu_verifikasi: 'Menunggu Verifikasi',
  perlu_perbaikan: 'Perlu Perbaikan',
  terverifikasi: 'Terverifikasi',
  diterima: 'Diterima',
  tidak_diterima: 'Tidak Diterima',
}

export const WARNA_STATUS: Record<StatusPendaftaran, string> = {
  menunggu_verifikasi: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  perlu_perbaikan: 'bg-orange-50 text-orange-700 border-orange-200',
  terverifikasi: 'bg-brand-sky/25 text-brand-navy border-brand-azure/40',
  diterima: 'bg-green-50 text-green-700 border-green-200',
  tidak_diterima: 'bg-red-50 text-red-700 border-red-200',
}

export const LABEL_JALUR: Record<NamaJalur, string> = {
  zonasi: 'Jalur Zonasi',
  prestasi: 'Jalur Prestasi',
  afirmasi: 'Jalur Afirmasi',
  mutasi: 'Jalur Mutasi / Anak Guru',
}

export const LABEL_DOKUMEN: Record<JenisDokumen, string> = {
  akta: 'Akta Kelahiran',
  skl: 'SKL / Surat Keterangan Lulus',
  kk: 'Kartu Keluarga (KK)',
  ktp_ayah: 'KTP Ayah',
  ktp_ibu: 'KTP Ibu',
}

export const LABEL_STATUS_DOKUMEN: Record<StatusDokumen, string> = {
  menunggu: 'Menunggu Verifikasi',
  diterima: 'Valid',
  perlu_revisi: 'Perlu Diperbaiki',
  ditolak: 'Ditolak',
}

export const WARNA_STATUS_DOKUMEN: Record<StatusDokumen, string> = {
  menunggu: 'bg-yellow-50 text-yellow-700',
  diterima: 'bg-green-50 text-green-700',
  perlu_revisi: 'bg-orange-50 text-orange-700',
  ditolak: 'bg-red-50 text-red-700',
}

// ─── Validasi file upload ───
export const MIME_TYPES_DITERIMA = ['image/jpeg', 'image/png', 'application/pdf']
export const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB

export function validasiFile(file: File): string | null {
  if (!MIME_TYPES_DITERIMA.includes(file.type)) {
    return 'Format file tidak didukung. Gunakan JPG, PNG, atau PDF.'
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'Ukuran file melebihi batas 2 MB.'
  }
  return null
}

// ─── Validasi field form ───
// Longgar: terima 08xxx, 628xxx, +628xxx, +62-8xxx, spasi, strip, dll.
export function validasiNomorWA(nomor: string): string | null {
  const bersih = nomor.replace(/[\s\-().]/g, '')
  if (!bersih) return 'Nomor WhatsApp wajib diisi.'
  // Minimal 9 digit setelah kode negara / awalan 0
  if (!/^\+?[0-9]{9,15}$/.test(bersih)) return 'Nomor WA tidak valid. Contoh: 08123456789'
  return null
}

export function validasiNISN(nisn: string): string | null {
  const bersih = nisn.trim()
  if (!bersih) return 'NISN wajib diisi.'
  if (!/^\d{10}$/.test(bersih)) return 'NISN harus 10 digit angka.'
  return null
}

export function validasiNomorKK(nomor: string): string | null {
  const bersih = nomor.trim()
  if (!bersih) return 'Nomor KK wajib diisi.'
  if (!/^\d{16}$/.test(bersih)) return 'Nomor KK harus 16 digit angka.'
  return null
}

export function validasiTanggalLahir(tgl: string): string | null {
  if (!tgl) return 'Tanggal lahir wajib diisi.'
  const d = new Date(tgl)
  if (isNaN(d.getTime())) return 'Tanggal lahir tidak valid.'
  if (d > new Date()) return 'Tanggal lahir tidak boleh di masa depan.'
  return null
}

// ─── Format tanggal Indonesia ───
export function formatTanggal(isoString: string): string {
  return new Date(isoString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatTanggalWaktu(isoString: string): string {
  return new Date(isoString).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
