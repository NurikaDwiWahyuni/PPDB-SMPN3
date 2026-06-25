import { createClient } from '@supabase/supabase-js'

// Singleton Supabase client (server-side, pakai service_role key)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = 'dokumen'

export const MIME_TYPES_DITERIMA = ['image/jpeg', 'image/png', 'application/pdf']
export const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB

/**
 * Simpan file ke Supabase Storage.
 * Mengembalikan path relatif yang disimpan ke DB.
 *
 * @param file      - File dari FormData
 * @param subFolder - Sub-folder dalam bucket (misal: nomor pendaftaran)
 * @param filename  - Nama file tujuan (tanpa ekstensi)
 * @returns           Path relatif, misal: "PPDB-2025-00001/akta.jpg"
 */
export async function simpanFile(
  file: File,
  subFolder: string,
  filename: string,
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin'
  const filePath = `${subFolder}/${filename}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (error) {
    console.error('[simpanFile] Supabase error:', error)
    console.error('[simpanFile] SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING')
    console.error('[simpanFile] SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING')
    throw new Error(`Gagal upload file: ${error.message}`)
  }

  return filePath
}

/**
 * Hapus file dari Supabase Storage (untuk rollback saat error).
 */
export async function hapusFile(relativePath: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([relativePath])
}

/**
 * Generate signed URL untuk akses file sementara (berlaku 1 jam).
 * Gunakan ini di API yang perlu menampilkan file ke admin/user.
 */
export async function getFileUrl(relativePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(relativePath, 3600)

  if (error || !data) throw new Error('Gagal generate URL file')
  return data.signedUrl
}

/**
 * Validasi file di sisi server: mime type dan ukuran.
 * Kembalikan pesan error atau null jika valid.
 */
export function validasiFileServer(file: File): string | null {
  if (!MIME_TYPES_DITERIMA.includes(file.type)) {
    return 'Format file tidak didukung. Gunakan JPG, PNG, atau PDF.'
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'Ukuran file melebihi batas 2 MB.'
  }
  return null
}
