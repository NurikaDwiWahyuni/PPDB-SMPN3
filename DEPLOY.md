# Panduan Deploy PPDB ke Supabase + Vercel

## Stack Production
- **Next.js 16** → Vercel
- **Database** → Supabase PostgreSQL (via Prisma ORM)
- **File Storage** → Supabase Storage (bucket: `dokumen`)
- **WhatsApp** → Fonnte (tidak berubah)

---

## LANGKAH 1 — Setup Supabase

### 1.1 Buat Project
1. Daftar/login di https://supabase.com
2. Klik **New Project**, isi nama & password database
3. Tunggu project selesai dibuat (~1-2 menit)

### 1.2 Ambil Kredensial Database
Pergi ke **Settings → Database → Connection string**:
- Tab **Transaction** → salin untuk `DATABASE_URL` (port 6543)
- Tab **Session** → salin untuk `DIRECT_URL` (port 5432)

### 1.3 Ambil API Keys
Pergi ke **Settings → API**:
- **Project URL** → untuk `NEXT_PUBLIC_SUPABASE_URL`
- **service_role (secret)** → untuk `SUPABASE_SERVICE_ROLE_KEY`

### 1.4 Buat Storage Bucket
1. Buka menu **Storage** → **New Bucket**
2. Nama: `dokumen`
3. Public bucket: **MATIKAN** (file hanya bisa diakses via signed URL)
4. Klik **Create bucket**

---

## LANGKAH 2 — Setup Lokal

### 2.1 Install dependency baru
```bash
npm install @supabase/supabase-js
```

### 2.2 Update file .env
Salin `.env.example` → `.env` dan isi semua nilai:
```bash
cp .env.example .env
```
Isi `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

### 2.3 Generate Prisma Client & Push Schema ke Supabase
```bash
# Generate ulang Prisma client untuk PostgreSQL
npm run db:generate

# Buat semua tabel di Supabase
npm run db:push

# Isi data awal (sekolah, tahun ajaran, jalur, admin)
npm run db:seed
```

### 2.4 Test lokal dulu
```bash
npm run dev
```
Coba pendaftaran, pastikan data masuk ke Supabase dan file terupload ke Storage bucket `dokumen`.

---

## LANGKAH 3 — Deploy ke Vercel

### 3.1 Push ke GitHub
```bash
git add .
git commit -m "migrate to supabase postgresql + supabase storage"
git push
```

### 3.2 Import ke Vercel
1. Login di https://vercel.com
2. **Add New Project** → Import repository GitHub
3. Framework: **Next.js** (auto-detect)
4. Klik **Environment Variables** → tambahkan semua variabel:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | postgresql://...6543/postgres?pgbouncer=true |
| `DIRECT_URL` | postgresql://...5432/postgres |
| `NEXT_PUBLIC_SUPABASE_URL` | https://[id].supabase.co |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJ... |
| `WA_TOKEN` | token fonnte |
| `WA_API_URL` | https://api.fonnte.com/send |
| `SESSION_SECRET` | string acak panjang |
| `NEXT_PUBLIC_APP_URL` | https://ppdb-namamu.vercel.app |

5. Klik **Deploy**

### 3.3 Update NEXT_PUBLIC_APP_URL
Setelah dapat URL Vercel (misal `ppdb-abc123.vercel.app`):
- Update env var `NEXT_PUBLIC_APP_URL` di Vercel dashboard
- Redeploy (atau push commit baru)

---

## Catatan Penting

### File Upload
- File tidak lagi disimpan di folder `uploads/` lokal
- File disimpan di Supabase Storage bucket `dokumen`
- Path yang disimpan di DB: `PPDB-2025-00001/akta.jpg` (relatif dalam bucket)
- Untuk menampilkan file ke user/admin, gunakan fungsi `getFileUrl(path)` dari `storage.ts`
  yang akan generate **signed URL** berlaku 1 jam

### Prisma di Vercel (Serverless)
- `DATABASE_URL` pakai port **6543** (pgbouncer) → wajib untuk serverless
- `DIRECT_URL` pakai port **5432** → hanya untuk `prisma migrate` / `db push`
- `postinstall` script sudah ada di package.json → Prisma generate otomatis saat build ✅

### Keamanan
- `SUPABASE_SERVICE_ROLE_KEY` jangan pernah diekspos ke client (browser)
- Hanya digunakan di server-side (API routes)
- `SESSION_SECRET` harus diganti dengan string acak panjang di production

---

## Perintah Berguna

```bash
# Cek koneksi ke Supabase
npm run db:studio

# Buat migration baru (production)
npm run db:migrate

# Push schema tanpa migration (development)
npm run db:push
```
