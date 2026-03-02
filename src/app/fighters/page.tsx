'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FighterCard } from '@/components/FighterCard'

export default function FightersPage() {
  const [fighters, setFighters] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      let query = supabase.from('fighters').select('*').order('name')
      if (search.trim()) {
        query = query.textSearch('fts', search.trim())
      }
      const { data } = await query.limit(100)
      setFighters(data ?? [])
      setLoading(false)
    }
    const debounce = setTimeout(load, 300)
    return () => clearTimeout(debounce)
  }, [search])

  return (
    <div>
      <h1 className="text-3xl font-black mb-6 text-red-500">Fighters</h1>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search fighters..."
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors mb-6"
      />
      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {fighters.map(f => (
            <FighterCard key={f.id} fighter={f} />
          ))}
          {fighters.length === 0 && <p className="text-zinc-500">No fighters found</p>}
        </div>
      )}
    </div>
  )
}
