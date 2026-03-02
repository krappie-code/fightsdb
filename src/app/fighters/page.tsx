'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { FighterCard } from '@/components/FighterCard'

const PAGE_SIZE = 30

export default function FightersPage() {
  const [fighters, setFighters] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<HTMLDivElement>(null)

  const loadFighters = useCallback(async (offset: number, searchTerm: string) => {
    const isInitial = offset === 0
    if (isInitial) setLoading(true)
    else setLoadingMore(true)

    let query = supabase.from('fighters').select('*').order('name')
    if (searchTerm.trim()) {
      query = query.ilike('name', `%${searchTerm.trim()}%`)
    }

    const { data } = await query.range(offset, offset + PAGE_SIZE - 1)
    const newFighters = data ?? []

    if (isInitial) {
      setFighters(newFighters)
    } else {
      setFighters(prev => [...prev, ...newFighters])
    }

    setHasMore(newFighters.length === PAGE_SIZE)
    setLoading(false)
    setLoadingMore(false)
  }, [])

  // Reset and load on search change
  useEffect(() => {
    setHasMore(true)
    const debounce = setTimeout(() => loadFighters(0, search), 300)
    return () => clearTimeout(debounce)
  }, [search, loadFighters])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!observerRef.current || !hasMore || loadingMore || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadFighters(fighters.length, search)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [fighters.length, hasMore, loadingMore, loading, search, loadFighters])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black text-red-500">Fighters</h1>
        <span className="text-sm text-zinc-500">{fighters.length} fighters loaded</span>
      </div>

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
        <>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {fighters.map(f => (
              <FighterCard key={f.id} fighter={f} />
            ))}
          </div>

          {fighters.length === 0 && !loading && (
            <p className="text-zinc-500 text-center py-8">No fighters found</p>
          )}

          {/* Infinite scroll trigger */}
          <div ref={observerRef} className="py-8 text-center">
            {loadingMore && (
              <p className="text-zinc-500">Loading more fighters...</p>
            )}
            {!hasMore && fighters.length > 0 && (
              <p className="text-zinc-600 text-sm">All fighters loaded</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
