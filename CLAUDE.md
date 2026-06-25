@AGENTS.md

---

# Panduan Proyek PPDB

## Stack
- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Prisma ORM** + **PostgreSQL**
- **Tailwind CSS v4**

## Perintah penting
```bash
npm install              # Install dependencies
npm run db:generate      # Generate Prisma client (wajib setelah ubah schema)
npm run db:push          # Push schema ke DB (development)
npm run db:migrate       # Buat migration file (production)
npm run db:seed          # Isi data awal (sekolah, tahun ajaran, jalur, admin)
npm run db:studio        # Buka Prisma Studio (GUI database)
npm run dev              # Jalankan dev server
```

## Struktur folder
```
app/
  _lib/
    db.ts        ← Prisma client singleton
    storage.ts   ← Helper simpan/hapus file upload
    types.ts     ← TypeScript types
    utils.ts     ← Label, warna, validasi
    wa.ts        ← Helper notifikasi WhatsApp (Fonnte)
  _components/
    ui.tsx       ← Shared UI components
    CekPengumuman.tsx
  api/
    pendaftaran/ ← POST: submit formulir + upload dokumen
    status/      ← GET: cek detail status pendaftaran
    pengumuman/  ← GET: cek hasil seleksi (publik)
    perbaikan/   ← GET: ambil dokumen perlu revisi | POST: upload ulang
  daftar/        ← Halaman formulir pendaftaran (5 step)
  status/        ← Halaman cek status
  perbaikan/     ← Halaman upload ulang dokumen
prisma/
  schema.prisma  ← 10 tabel sesuai ppdb_schema_v2.md
  seed.ts        ← Data awal
```

## Environment variables
Salin `.env.example` → `.env` dan isi:
- `DATABASE_URL` — koneksi PostgreSQL
- `UPLOAD_DIR` — folder penyimpanan file (default: `uploads/dokumen`)
- `WA_TOKEN` — token Fonnte untuk notifikasi WhatsApp
- `NEXT_PUBLIC_APP_URL` — URL app (untuk link dalam pesan WA)

## Alur utama (sesuai skema)
1. **Pendaftaran** → `POST /api/pendaftaran` → simpan ke DB + upload file + kirim WA
2. **Verifikasi admin** → dilakukan manual di dashboard (belum dibuat)
3. **Perbaikan** → `GET /api/perbaikan` → tampilkan dokumen perlu revisi → `POST /api/perbaikan` → simpan baris baru, status kembali ke `menunggu_verifikasi`
4. **Cek status** → `GET /api/status?nomor=...`
5. **Pengumuman** → `GET /api/pengumuman?q=...` (hanya jika `published=true`)

## Yang belum dibuat
- [ ] Dashboard admin (verifikasi berkas, seleksi, publikasi pengumuman)
- [ ] Autentikasi admin (login/logout)
- [ ] API jadwal dari DB (saat ini data di `page.tsx` masih statis)
- [ ] Validasi NISN ke Dapodik
