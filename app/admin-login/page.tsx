'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LogoSekolah } from '@/app/_components/ui'

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Username dan password wajib diisi.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.message ?? 'Username atau password salah.')
        return
      }
      const cb = searchParams.get('callbackUrl') || ''
      const callbackUrl = cb.startsWith('/admin') && !cb.startsWith('/admin-login') && !cb.startsWith('/admin/login')
        ? cb
        : '/admin/dashboard'
      router.push(callbackUrl)
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-azure/20 shadow-sm p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-brand-navy mb-1.5">
            Username
          </label>
          <input
            id="username" type="text" autoComplete="username"
            value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder="Masukkan username"
            className="w-full px-3 py-2.5 border border-brand-azure/30 rounded-lg text-sm text-brand-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-azure focus:border-transparent bg-white transition-shadow"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-brand-navy mb-1.5">
            Password
          </label>
          <input
            id="password" type="password" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password"
            className="w-full px-3 py-2.5 border border-brand-azure/30 rounded-lg text-sm text-brand-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-azure focus:border-transparent bg-white transition-shadow"
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}
        <button type="submit" disabled={loading}
          className="w-full py-2.5 rounded-lg bg-brand-navy text-white text-sm font-semibold hover:bg-brand-navy-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1">
          {loading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-navy mb-4 shadow-lg">
            <LogoSekolah size={38} />
          </div>
          <h1 className="text-xl font-bold text-brand-navy">Panel Admin</h1>
          <p className="text-sm text-slate-500 mt-1">SPMB SMP Negeri 3 Bagan Sinembah</p>
        </div>
        <Suspense fallback={
          <div className="bg-white rounded-2xl border border-brand-azure/20 shadow-sm p-6 sm:p-8 text-center text-sm text-slate-400">
            Memuat...
          </div>
        }>
          <LoginForm />
        </Suspense>
        <p className="text-center text-xs text-slate-400 mt-6">© 2026 SPMB SMP Negeri 3 Bagan Sinembah</p>
      </div>
    </div>
  )
}
