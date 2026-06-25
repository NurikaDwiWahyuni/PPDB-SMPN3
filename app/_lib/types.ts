// ─── Types berdasarkan skema database ppdb_schema_v2.md ───

export type StatusPendaftaran =
  | 'menunggu_verifikasi'
  | 'perlu_perbaikan'
  | 'terverifikasi'
  | 'diterima'
  | 'tidak_diterima'

export type NamaJalur = 'zonasi' | 'afirmasi' | 'mutasi' | 'prestasi'

export type JenisDokumen = 'akta' | 'skl' | 'kk' | 'ktp_ayah' | 'ktp_ibu'

export type StatusDokumen = 'menunggu' | 'diterima' | 'perlu_revisi' | 'ditolak'

export type SumberPendaftaran = 'online' | 'offline'

// ─── Payload untuk form pendaftaran ───

export interface FormDataOrangTua {
  nama_ayah: string
  nama_ibu: string
  nomor_wa: string
  alamat: string
}

export type UkuranBaju = 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL'

export interface FormDataSiswa {
  nisn: string
  nomor_kk: string
  nama_lengkap: string
  tempat_lahir: string
  tanggal_lahir: string // ISO date string
  jenis_kelamin: 'L' | 'P'
  agama: 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Konghucu'
  asal_sekolah: string
  ukuran_baju: UkuranBaju
}

export interface FormPendaftaran {
  jalur_id: number
  data_orangtua: FormDataOrangTua
  data_siswa: FormDataSiswa
}

// ─── Response API ───

export interface ApiResponse<T = null> {
  success: boolean
  message: string
  data?: T
}

export interface PendaftaranDetail {
  id: number
  nomor_pendaftaran: string
  status: StatusPendaftaran
  catatan_admin: string | null
  tanggal_daftar: string
  jalur: {
    id: number
    nama_jalur: NamaJalur
  }
  data_orangtua: {
    nama_ayah: string
    nama_ibu: string
    nomor_wa: string
    alamat: string
  }
  data_siswa: {
    nama_lengkap: string
    nisn: string
    tempat_lahir: string
    tanggal_lahir: string
    jenis_kelamin: 'L' | 'P'
    asal_sekolah: string
  }
  dokumen: Array<{
    id: number
    jenis_dokumen: JenisDokumen
    status: StatusDokumen
    catatan_admin: string | null
    uploaded_at: string
  }>
}

export interface HasilSeleksi {
  nama_lengkap: string
  nisn: string
  nomor_pendaftaran: string
  jalur: NamaJalur
  hasil: 'diterima' | 'tidak_diterima'
  catatan: string | null
}

// ─── Info publik ───

export interface JadwalItem {
  id: number
  nama_kegiatan: string
  tanggal_mulai: string
  tanggal_selesai: string
  keterangan: string | null
}

export interface JalurInfo {
  id: number
  nama_jalur: NamaJalur
  kuota: number
  kuota_terpakai: number
  deskripsi: string
  is_aktif: boolean
}
