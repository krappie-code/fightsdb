'use client'

import { useState, useEffect } from 'react'

const ADMIN_KEY = 'fightsdb_admin_auth'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_KEY)
    if (stored === 'true') setAuthed(true)
    setChecking(false)
  }, [])

  const handleLogin = async () => {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      sessionStorage.setItem(ADMIN_KEY, 'true')
      setAuthed(true)
    } else {
      setError('Wrong password')
    }
  }

  if (checking) return null

  if (!authed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-white mb-4">🔒 Admin Access</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Enter admin password"
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 mb-3"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <button
            onClick={handleLogin}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-medium py-2 rounded transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
