'use client'

import { useEffect, useState, useCallback } from 'react'

interface Event {
  id: string
  name: string
  date: string
  location?: string
  poster_url?: string
  event_type?: string
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [count, setCount] = useState(0)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Event>>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ search, filter, page: String(page) })
    const res = await fetch(`/api/admin/events?${params}`)
    const json = await res.json()
    setEvents(json.data || [])
    setCount(json.count || 0)
    setLoading(false)
  }, [search, filter, page])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const startEdit = (e: Event) => {
    setEditing(e.id)
    setEditData({
      name: e.name,
      date: e.date,
      location: e.location || '',
      poster_url: e.poster_url || '',
      event_type: e.event_type || '',
    })
  }

  const save = async () => {
    if (!editing) return
    setSaving(true)
    await fetch('/api/admin/events', {
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
        <h1 className="text-2xl font-bold text-white">📅 Manage Events</h1>
        <span className="text-sm text-zinc-500">{count} total</span>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          placeholder="Search events..."
          className="flex-1 min-w-[200px] bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
        />
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(0) }}
          className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
        >
          <option value="all">All events</option>
          <option value="no-poster">Missing poster</option>
        </select>
      </div>

      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : (
        <div className="space-y-2">
          {events.map(e => (
            <div key={e.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              {editing === e.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Name" value={editData.name || ''} onChange={v => setEditData({ ...editData, name: v })} />
                    <Field label="Date" value={editData.date || ''} onChange={v => setEditData({ ...editData, date: v })} type="date" />
                    <Field label="Location" value={editData.location || ''} onChange={v => setEditData({ ...editData, location: v })} />
                    <Field label="Event Type" value={editData.event_type || ''} onChange={v => setEditData({ ...editData, event_type: v })} />
                  </div>
                  <Field label="Poster URL" value={editData.poster_url || ''} onChange={v => setEditData({ ...editData, poster_url: v })} />
                  {editData.poster_url && (
                    <img src={editData.poster_url} alt="Preview" className="w-24 h-auto rounded" />
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
                  <div className="w-12 h-16 bg-zinc-800 rounded overflow-hidden flex-shrink-0">
                    {e.poster_url ? (
                      <img src={e.poster_url} alt={e.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">📅</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-white">{e.name}</span>
                    <div className="flex gap-3 text-xs mt-1">
                      <span className="text-zinc-400">{new Date(e.date).toLocaleDateString()}</span>
                      {e.location && <span className="text-zinc-500">{e.location}</span>}
                      {!e.poster_url && <span className="text-red-400">⚠ No poster</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => startEdit(e)}
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

      <div className="flex items-center justify-between mt-6">
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="text-sm text-zinc-400 hover:text-white disabled:text-zinc-700 transition-colors">← Previous</button>
        <span className="text-sm text-zinc-500">Page {page + 1} of {Math.ceil(count / 50)}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * 50 >= count} className="text-sm text-zinc-400 hover:text-white disabled:text-zinc-700 transition-colors">Next →</button>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-zinc-500 block mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-red-500" />
    </div>
  )
}
