/**
 * Helper notifikasi WhatsApp via Fonnte API.
 * Dokumentasi: https://fonnte.com/docs
 *
 * Notifikasi WA hanya dikirim untuk:
 * 1. Pendaftaran online berhasil (nomor pendaftaran)
 * 2. Admin meminta perbaikan dokumen
 *
 * Tidak dikirim untuk: pendaftaran offline, hasil seleksi, selesai perbaikan.
 */

const WA_TOKEN   = process.env.WA_TOKEN   ?? ''
const WA_API_URL = process.env.WA_API_URL ?? 'https://api.fonnte.com/send'
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

const FOOTER = `\n\n_Jangan balas pesan ini. Pesan ini dikirim secara otomatis oleh sistem SPMB SMP Negeri 3 Bagan Sinembah._`

interface KirimWAParams {
  nomor: string
  pesan: string
}

export async function kirimWA({ nomor, pesan }: KirimWAParams): Promise<boolean> {
  if (!WA_TOKEN) {
    console.log(`[WA DEV] → ${nomor}:\n${pesan}`)
    return true
  }

  try {
    const res = await fetch(WA_API_URL, {
      method: 'POST',
      headers: {
        Authorization: WA_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        target: nomor,
        message: pesan,
        countryCode: '62',
      }),
    })

    const json = await res.json()
    if (!json.status) {
      console.error('[WA] Gagal kirim:', json)
      return false
    }
    return true
  } catch (err) {
    console.error('[WA] Exception:', err)
    return false
  }
}

// ── Template pesan ──────────────────────────────────────────────────────────

/** Dikirim saat pendaftaran online berhasil */
export function pesanNomorPendaftaran(nomor: string, namaSiswa: string): string {
  return (
    `✅ *Pendaftaran SPMB 2026/2027 Berhasil*\n\n` +
    `Nama calon siswa: *${namaSiswa}*\n` +
    `Nomor pendaftaran: *${nomor}*\n\n` +
    `Simpan nomor ini untuk memantau status verifikasi berkas.\n\n` +
    `🔗 Pantau status:\n${APP_URL}/status?nomor=${encodeURIComponent(nomor)}` +
    FOOTER
  )
}

/** Dikirim saat admin meminta perbaikan dokumen */
export function pesanPerluPerbaikan(
  nomor: string,
  namaSiswa: string,
  catatan?: string | null,
): string {
  return (
    `⚠️ *Dokumen SPMB Perlu Diperbaiki*\n\n` +
    `Nama calon siswa: *${namaSiswa}*\n` +
    `Nomor pendaftaran: *${nomor}*\n\n` +
    `${catatan ? `Catatan admin:\n_${catatan}_\n\n` : ''}` +
    `🔗 Upload ulang dokumen:\n${APP_URL}/perbaikan?nomor=${encodeURIComponent(nomor)}` +
    FOOTER
  )
}
