// ─── Shared UI components ───
'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { StatusPendaftaran, StatusDokumen } from '@/app/_lib/types'
import { LABEL_STATUS, WARNA_STATUS, LABEL_STATUS_DOKUMEN, WARNA_STATUS_DOKUMEN } from '@/app/_lib/utils'

export function BadgeStatus({ status }: { status: StatusPendaftaran }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${WARNA_STATUS[status]}`}>
      {LABEL_STATUS[status]}
    </span>
  )
}

export function BadgeStatusDokumen({ status }: { status: StatusDokumen }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${WARNA_STATUS_DOKUMEN[status]}`}>
      {LABEL_STATUS_DOKUMEN[status]}
    </span>
  )
}

export function Tombol({
  children, type = 'button', onClick, disabled, variant = 'primary', className = '',
}: {
  children: React.ReactNode; type?: 'button' | 'submit'; onClick?: () => void
  disabled?: boolean; variant?: 'primary' | 'secondary' | 'danger'; className?: string
}) {
  const base = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const varian = {
    primary:   'bg-brand-navy text-white hover:bg-brand-navy-dark',
    secondary: 'bg-white text-brand-navy border border-brand-azure/40 hover:bg-brand-cream',
    danger:    'bg-red-600 text-white hover:bg-red-700',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${varian[variant]} ${className}`}>
      {children}
    </button>
  )
}

export function InputField({
  label, name, type = 'text', value, onChange, placeholder, required, hint, error,
}: {
  label: string; name: string; type?: string; value: string; onChange: (v: string) => void
  placeholder?: string; required?: boolean; hint?: string; error?: string
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-brand-navy mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name} name={name} type={type} value={value}
        onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-white text-brand-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-azure focus:border-transparent transition-shadow ${error ? 'border-red-400' : 'border-brand-azure/30'}`}
      />
      {hint  && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function SelectField({
  label, name, value, onChange, options, required,
}: {
  label: string; name: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; required?: boolean
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-brand-navy mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select id={name} name={name} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-brand-azure/30 rounded-lg text-sm bg-white text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-azure">
        <option value="">-- Pilih --</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export function InfoBox({ children, variant = 'info' }: { children: React.ReactNode; variant?: 'info' | 'warn' | 'success' | 'danger' }) {
  const warna = {
    info:    'bg-brand-sky/25 border-brand-azure/40 text-brand-navy',
    warn:    'bg-amber-50 border-amber-200 text-amber-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    danger:  'bg-red-50 border-red-200 text-red-800',
  }
  return <div className={`rounded-lg border p-3 text-sm ${warna[variant]}`}>{children}</div>
}

export function NotifWA({ pesan }: { pesan: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
      <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      <div>
        <p className="font-medium text-green-800 text-xs">Notifikasi WhatsApp</p>
        <p className="text-green-700 text-xs mt-0.5">{pesan}</p>
      </div>
    </div>
  )
}

export function StepBar({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center mb-8 overflow-x-auto">
      {steps.map((label, i) => {
        const idx = i + 1
        const done = idx < current
        const active = idx === current
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none min-w-[60px]">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${done ? 'bg-brand-navy text-white' : active ? 'bg-brand-navy text-white ring-4 ring-brand-sky/40' : 'bg-brand-cream text-slate-400'}`}>
                {done ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : idx}
              </div>
              <span className={`mt-1 text-[10px] sm:text-xs text-center max-w-[60px] ${active ? 'text-brand-navy font-medium' : 'text-slate-400'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-1 sm:mx-2 mb-5 ${done ? 'bg-brand-navy' : 'bg-brand-azure/20'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Logo sekolah ──
export function LogoSekolah({ size = 40 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Logo SMP Negeri 3 Bagan Sinembah"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  )
}

// ── Navbar publik (responsif, dengan menu mobile) ──
export function NavbarPublik({ active }: { active?: string }) {
  const [open, setOpen] = useState(false)

  const links = [
    { href: '/#jadwal',       label: 'Jadwal' },
    { href: '/#persyaratan',  label: 'Persyaratan' },
    { href: '/#jalur',        label: 'Jalur' },
    { href: '/#pengumuman',   label: 'Pengumuman' },
  ]

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-brand-azure/20 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5 min-w-0" onClick={() => setOpen(false)}>
          <LogoSekolah size={34} />
          <div className="min-w-0">
            <p className="font-bold text-brand-navy text-xs sm:text-sm leading-tight truncate max-w-[150px] sm:max-w-none">SMPN 3 Bagan Sinembah</p>
            <p className="text-xs text-slate-500 leading-tight">SPMB 2026/2027</p>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${active === l.label ? 'bg-brand-sky/30 text-brand-navy font-medium' : 'text-slate-600 hover:bg-brand-cream hover:text-brand-navy'}`}>
              {l.label}
            </Link>
          ))}
          <Link href="/status"
            className="flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-brand-cream hover:text-brand-navy transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Status
          </Link>
          <Link href="/daftar"
            className="ml-2 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-navy text-white hover:bg-brand-navy-dark transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Daftar Sekarang
          </Link>
          <Link href="/admin-login" title="Login Admin"
            className="ml-1 p-2 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-brand-cream transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </Link>
        </div>

        {/* Mobile: tombol Daftar ringkas + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/daftar"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-brand-navy text-white hover:bg-brand-navy-dark transition-colors">
            Daftar
          </Link>
          <button
            type="button"
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            onClick={() => setOpen((v) => !v)}
            className="p-2 rounded-lg text-brand-navy hover:bg-brand-cream transition-colors"
          >
            {open ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-brand-azure/20 bg-white px-4 py-3 space-y-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${active === l.label ? 'bg-brand-sky/30 text-brand-navy font-medium' : 'text-slate-600 hover:bg-brand-cream'}`}>
              {l.label}
            </Link>
          ))}
          <Link href="/status" onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-brand-cream">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Cek Status
          </Link>
          <Link href="/admin-login" onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-brand-cream">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Login Admin
          </Link>
        </div>
      )}
    </nav>
  )
}
