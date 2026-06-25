// app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { getSession } from '@/app/_lib/session'
import { AdminSidebar } from './_components/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sesi = await getSession()
  if (!sesi) redirect('/admin-login')

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-brand-cream">
      <AdminSidebar nama={sesi.nama} role={sesi.role} />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
