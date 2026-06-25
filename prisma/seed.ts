// prisma/seed.ts
// Jalankan: npm run db:seed

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Memulai seed...')

  // 1. Sekolah
  const sekolah = await prisma.sekolah.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nama_sekolah: 'SMP Negeri 3 Bagan Sinembah',
      npsn: '10404321',
      alamat: 'Bagan Sinembah, Rokan Hilir, Riau',
      nomor_telepon: '',
      email: '',
    },
  })
  console.log('✅ Sekolah:', sekolah.nama_sekolah)

  // 2. Tahun Ajaran
  const tahunAjaran = await prisma.tahunAjaran.upsert({
    where: { id: 1 },
    update: {},
    create: {
      sekolah_id: sekolah.id,
      nama: '2026/2027',
      status: 'aktif',
    },
  })
  console.log('✅ Tahun Ajaran:', tahunAjaran.nama)

  // 3. Jalur Pendaftaran
  const jalurData = [
    { nama_jalur: 'zonasi'   as const, kuota: 128, deskripsi: 'Seleksi berdasarkan domisili calon peserta didik sesuai ketentuan yang berlaku.' },
    { nama_jalur: 'prestasi' as const, kuota: 77,  deskripsi: 'Diperuntukkan bagi calon peserta didik yang memiliki prestasi akademik maupun non-akademik.' },
    { nama_jalur: 'afirmasi' as const, kuota: 38,  deskripsi: 'Diperuntukkan bagi calon peserta didik dari keluarga kurang mampu atau kategori tertentu.' },
    { nama_jalur: 'mutasi'   as const, kuota: 13,  deskripsi: 'Diperuntukkan bagi calon peserta didik yang mengikuti perpindahan tugas orang tua.' },
  ]

  for (const j of jalurData) {
    await prisma.jalurPendaftaran.upsert({
      where: { id: jalurData.indexOf(j) + 1 },
      update: {},
      create: { tahun_ajaran_id: tahunAjaran.id, ...j },
    })
  }
  console.log('✅ Jalur pendaftaran: 4 jalur')

  // 4. Admin — username: admin, password: admin123
  const passwordHash = await bcrypt.hash('admin123', 12)
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: { password_hash: passwordHash },
    create: {
      sekolah_id: sekolah.id,
      nama: 'Administrator',
      username: 'admin',
      password_hash: passwordHash,
      role: 'superadmin',
      is_aktif: true,
    },
  })
  console.log('✅ Admin dibuat:', admin.username, '(role:', admin.role + ')')
  console.log('')
  console.log('─────────────────────────────')
  console.log('  Username : admin')
  console.log('  Password : admin123')
  console.log('─────────────────────────────')
  console.log('🎉 Seed selesai!')
}

main()
  .catch((e) => {
    console.error('❌ Seed gagal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
