'use client'

import { useEffect, useState } from 'react'
import { formatTanggalWaktu } from '@/app/_lib/utils'

interface Akun {
  id: number
  nama: string
  username: string
  role: 'superadmin' | 'operator' | 'viewer'
  is_aktif: boolean
  last_login: string | null
  created_at: string
}

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Super Admin',
  operator:   'Operator',
  viewer:     'Viewer',
}

const ROLE_WARNA: Record<string, string> = {
  superadmin: 'bg-brand-navy text-white',
  operator:   'bg-brand-sky/40 text-brand-navy',
  viewer:     'bg-brand-cream text-slate-600 border border-brand-azure/20',
}

const defaultForm = { nama: '', username: '', password: '', role: 'operator' }

export default function AkunPage() {
  const [akun, setAkun]         = useState<Akun[]>([])
  const [loading, setLoading]   = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [modal, setModal]       = useState<'tambah' | 'edit' | 'hapus' | null>(null)
  const [selected, setSelected] = useState<Akun | null>(null)
  const [form, setForm]         = useState(defaultForm)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')

  function load() {
    setLoading(true)
    fetch('/api/admin/akun')
      .then((r) => r.json())
      .then((j) => { setAkun(j.data ?? []); setIsSuperAdmin(j.is_superadmin ?? false); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function bukaEdit(a: Akun) {
    setSelected(a)
    setForm({ nama: a.nama, username: a.username, password: '', role: a.role })
    setMsg('')
    setModal('edit')
  }

  function bukaTambah() {
    setSelected(null)
    setForm(defaultForm)
    setMsg('')
    setModal('tambah')
  }

  async function simpan() {
    setSaving(true); setMsg('')
    const url    = '/api/admin/akun'
    const method = modal === 'tambah' ? 'POST' : 'PATCH'
    const body   = modal === 'tambah'
      ? form
      : { id: selected!.id, ...form }

    const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const json = await res.json()
    setSaving(false)
    if (json.success) { load(); setModal(null) }
    else setMsg(json.message)
  }

  async function hapus() {
    if (!selected) return
    setSaving(true)
    const res  = await fetch('/api/admin/akun', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selected.id }) })
    const json = await res.json()
    setSaving(false)
    if (json.success) { load(); setModal(null) }
    else setMsg(json.message)
  }

  async function toggleAktif(a: Akun) {
    await fetch('/api/admin/akun', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, is_aktif: !a.is_aktif }),
    })
    load()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-brand-navy">Kelola Akun Admin</h1>
          <p className="text-sm text-slate-500 mt-1">{akun.length} akun terdaftar</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={bukaTambah}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-navy text-white text-sm font-medium rounded-lg hover:bg-brand-navy-dark transition-colors self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Akun
          </button>
        )}
      </div>

        {loading ? (
        <div className="text-center text-slate-400 py-12 text-sm">Memuat data...</div>
      ) : (
        <div className="bg-white rounded-xl border border-brand-azure/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-brand-cream border-b border-brand-azure/15">
                <tr>
                  {['Nama', 'Username', 'Role', 'Status', 'Login Terakhir', 'Aksi'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-cream">
                {akun.map((a) => (
                  <tr key={a.id} className="hover:bg-brand-cream/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-brand-navy">{a.nama}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{a.username}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_WARNA[a.role]}`}>
                        {ROLE_LABEL[a.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isSuperAdmin ? (
                        <button
                          onClick={() => toggleAktif(a)}
                          className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${a.is_aktif ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200' : 'bg-brand-cream text-slate-500 hover:bg-brand-sky/20 border border-brand-azure/20'}`}
                        >
                          {a.is_aktif ? 'Aktif' : 'Nonaktif'}
                        </button>
                      ) : (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${a.is_aktif ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-brand-cream text-slate-500 border border-brand-azure/20'}`}>
                          {a.is_aktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {a.last_login ? formatTanggalWaktu(a.last_login) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {isSuperAdmin && (
                          <>
                            <button
                              onClick={() => bukaEdit(a)}
                              className="px-3 py-1.5 text-xs font-medium border border-brand-azure/30 rounded-lg hover:bg-brand-cream transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => { setSelected(a); setMsg(''); setModal('hapus') }}
                              className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              Hapus
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit */}
      {(modal === 'tambah' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-brand-navy mb-5">
              {modal === 'tambah' ? 'Tambah Akun Admin' : 'Edit Akun'}
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Nama Lengkap', key: 'nama',     type: 'text',     placeholder: 'Nama admin' },
                { label: 'Username',     key: 'username', type: 'text',     placeholder: 'Username login' },
                { label: modal === 'edit' ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password', key: 'password', type: 'password', placeholder: 'Min. 6 karakter' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-brand-azure/30 rounded-lg text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-azure bg-white placeholder-slate-400"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-brand-azure/30 rounded-lg text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-azure bg-white"
                >
                  <option value="superadmin">Super Admin</option>
                  <option value="operator">Operator</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
            {msg && <p className="mt-3 text-xs text-red-600">{msg}</p>}
            <div className="flex gap-2 mt-6">
              <button onClick={() => setModal(null)}
                className="flex-1 py-2.5 border border-brand-azure/30 text-brand-navy text-sm rounded-lg hover:bg-brand-cream transition-colors">
                Batal
              </button>
              <button onClick={simpan} disabled={saving}
                className="flex-1 py-2.5 bg-brand-navy text-white text-sm rounded-lg hover:bg-brand-navy-dark disabled:opacity-40 transition-colors">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {modal === 'hapus' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-brand-navy mb-2">Hapus Akun?</h2>
            <p className="text-sm text-slate-500 mb-5">
              Akun <span className="font-semibold text-brand-navy">{selected.nama}</span> ({selected.username}) akan dihapus permanen.
            </p>
            {msg && <p className="text-xs text-red-600 mb-3">{msg}</p>}
            <div className="flex gap-2">
              <button onClick={() => setModal(null)}
                className="flex-1 py-2.5 border border-brand-azure/30 text-brand-navy text-sm rounded-lg hover:bg-brand-cream transition-colors">
                Batal
              </button>
              <button onClick={hapus} disabled={saving}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors">
                {saving ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
