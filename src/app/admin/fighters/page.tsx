'use client'

import { useEffect, useState, useCallback } from 'react'

interface Fighter {
  id: string
  name: string
  nickname?: string
  image_url?: string
  birth_location?: string
  wins: number
  losses: number
  draws: number
  weight_class?: string
  height?: string
  reach?: number
  stance?: string
}

export default function AdminFightersPage() {
  const [fighters, setFighters] = useState<Fighter[]>([])
  const [count, setCount] = useState(0)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Fighter>>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ search, filter, page: String(page) })
    const res = await fetch(`/api/admin/fighters?${params}`)
    const json = await res.json()
    setFighters(json.data || [])
    setCount(json.count || 0)
    setLoading(false)
  }, [search, filter, page])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const startEdit = (f: Fighter) => {
    setEditing(f.id)
    setEditData({
      name: f.name,
      nickname: f.nickname || '',
      image_url: f.image_url || '',
      birth_location: f.birth_location || '',
      wins: f.wins,
      losses: f.losses,
      draws: f.draws,
      weight_class: f.weight_class || '',
      height: f.height || '',
      reach: f.reach || undefined,
      stance: f.stance || '',
    })
  }

  const save = async () => {
    if (!editing) return
    setSaving(true)
    await fetch('/api/admin/fighters', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editing, ...editData }),
    })
    setEditing(null)
    setSaving(false)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">🥊 Manage Fighters</h1>
        <span className="text-sm text-zinc-500">{count} total</span>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          placeholder="Search fighters..."
          className="flex-1 min-w-[200px] bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
        />
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(0) }}
          className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
        >
          <option value="all">All fighters</option>
          <option value="no-image">Missing image</option>
          <option value="no-country">Missing country</option>
          <option value="no-record">Missing record</option>
        </select>
      </div>

      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : (
        <div className="space-y-2">
          {fighters.map(f => (
            <div key={f.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              {editing === f.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Field label="Name" value={editData.name || ''} onChange={v => setEditData({ ...editData, name: v })} />
                    <Field label="Nickname" value={editData.nickname || ''} onChange={v => setEditData({ ...editData, nickname: v })} />
                    <Field label="Weight Class" value={editData.weight_class || ''} onChange={v => setEditData({ ...editData, weight_class: v })} />
                    <Field label="Wins" value={String(editData.wins ?? 0)} onChange={v => setEditData({ ...editData, wins: parseInt(v) || 0 })} type="number" />
                    <Field label="Losses" value={String(editData.losses ?? 0)} onChange={v => setEditData({ ...editData, losses: parseInt(v) || 0 })} type="number" />
                    <Field label="Draws" value={String(editData.draws ?? 0)} onChange={v => setEditData({ ...editData, draws: parseInt(v) || 0 })} type="number" />
                    <Field label="Country / Location" value={editData.birth_location || ''} onChange={v => setEditData({ ...editData, birth_location: v })} />
                    <Field label="Height" value={editData.height || ''} onChange={v => setEditData({ ...editData, height: v })} />
                    <Field label="Stance" value={editData.stance || ''} onChange={v => setEditData({ ...editData, stance: v })} />
                  </div>
                  <Field label="Image URL" value={editData.image_url || ''} onChange={v => setEditData({ ...editData, image_url: v })} />
                  {editData.image_url && (
                    <img src={editData.image_url} alt="Preview" className="w-16 h-16 rounded-full object-cover" />
                  )}
                  <div className="flex gap-2">
                    <button onClick={save} disabled={saving} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded text-sm transition-colors">
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setEditing(null)} className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-1.5 rounded text-sm transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
                    {f.image_url ? (
                      <img src={f.image_url} alt={f.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm font-bold">
                        {f.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white">{f.name}</span>
                      <span className="text-zinc-500 text-sm font-mono">{f.wins}-{f.losses}-{f.draws}</span>
                      {f.weight_class && <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded">{f.weight_class}</span>}
                    </div>
                    <div className="flex gap-3 text-xs mt-1">
                      {f.birth_location ? (
                        <span className="text-zinc-400">{f.birth_location}</span>
                      ) : (
                        <span className="text-red-400">⚠ No country</span>
                      )}
                      {!f.image_url && <span className="text-red-400">⚠ No image</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => startEdit(f)}
                    className="text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded text-sm transition-colors flex-shrink-0"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          className="text-sm text-zinc-400 hover:text-white disabled:text-zinc-700 transition-colors"
        >
          ← Previous
        </button>
        <span className="text-sm text-zinc-500">Page {page + 1} of {Math.ceil(count / 50)}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={(page + 1) * 50 >= count}
          className="text-sm text-zinc-400 hover:text-white disabled:text-zinc-700 transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-zinc-500 block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-red-500"
      />
    </div>
  )
}
