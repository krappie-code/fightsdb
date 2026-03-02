'use client'

import { useEffect, useState, useCallback } from 'react'

interface Fight {
  id: string
  weight_class?: string
  title_fight: boolean
  title_fight_type?: string
  main_event: boolean
  result?: string
  method?: string
  method_detail?: string
  round?: number
  time?: string
  fighter1?: { id: string; name: string }
  fighter2?: { id: string; name: string }
  event?: { id: string; name: string; date: string }
}

export default function AdminFightsPage() {
  const [fights, setFights] = useState<Fight[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Fight>>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    const res = await fetch(`/api/admin/fights?${params}`)
    const json = await res.json()
    setFights(json.data || [])
    setCount(json.count || 0)
    setLoading(false)
  }, [page])

  useEffect(() => { load() }, [load])

  const startEdit = (f: Fight) => {
    setEditing(f.id)
    setEditData({
      weight_class: f.weight_class || '',
      title_fight: f.title_fight,
      title_fight_type: f.title_fight_type || '',
      main_event: f.main_event,
      result: f.result || '',
      method: f.method || '',
      method_detail: f.method_detail || '',
      round: f.round || undefined,
      time: f.time || '',
    })
  }

  const save = async () => {
    if (!editing) return
    setSaving(true)
    await fetch('/api/admin/fights', {
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
        <h1 className="text-2xl font-bold text-white">⚔️ Manage Fights</h1>
        <span className="text-sm text-zinc-500">{count} total</span>
      </div>

      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : (
        <div className="space-y-2">
          {fights.map(f => (
            <div key={f.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              {editing === f.id ? (
                <div className="space-y-3">
                  <p className="text-white font-bold text-sm">{f.fighter1?.name} vs {f.fighter2?.name}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Field label="Result" value={editData.result || ''} onChange={v => setEditData({ ...editData, result: v })} />
                    <Field label="Method" value={editData.method || ''} onChange={v => setEditData({ ...editData, method: v })} />
                    <Field label="Method Detail" value={editData.method_detail || ''} onChange={v => setEditData({ ...editData, method_detail: v })} />
                    <Field label="Round" value={String(editData.round ?? '')} onChange={v => setEditData({ ...editData, round: parseInt(v) || undefined })} type="number" />
                    <Field label="Time" value={editData.time || ''} onChange={v => setEditData({ ...editData, time: v })} />
                    <Field label="Weight Class" value={editData.weight_class || ''} onChange={v => setEditData({ ...editData, weight_class: v })} />
                    <div>
                      <label className="text-xs text-zinc-500 block mb-1">Title Fight Type</label>
                      <select value={editData.title_fight_type || ''} onChange={e => setEditData({ ...editData, title_fight_type: e.target.value || undefined, title_fight: !!e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-white text-sm">
                        <option value="">Not a title fight</option>
                        <option value="undisputed">Undisputed</option>
                        <option value="interim">Interim</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <input type="checkbox" checked={editData.main_event || false} onChange={e => setEditData({ ...editData, main_event: e.target.checked })} className="rounded" />
                      <label className="text-sm text-zinc-400">Main Event</label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={save} disabled={saving} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded text-sm transition-colors">{saving ? 'Saving...' : 'Save'}</button>
                    <button onClick={() => setEditing(null)} className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-1.5 rounded text-sm transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{f.fighter1?.name} vs {f.fighter2?.name}</span>
                      {f.title_fight && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">🏆 TITLE</span>}
                      {f.main_event && <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">MAIN</span>}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {f.event?.name} • {f.result} • {f.method} {f.method_detail ? `(${f.method_detail})` : ''} • R{f.round} {f.time}
                    </div>
                  </div>
                  <button onClick={() => startEdit(f)} className="text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded text-sm transition-colors flex-shrink-0">Edit</button>
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
