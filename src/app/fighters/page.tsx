'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { FighterCard } from '@/components/FighterCard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PAGE_SIZE = 30

export default function FightersPage() {
  const [fighters, setFighters] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Initial load + search
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      let query = supabase.from('fighters').select('*', { count: 'exact' }).order('name')
      if (search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`)
      }
      const { data, count } = await query.range(0, PAGE_SIZE - 1)
      setFighters(data ?? [])
      setTotalCount(count ?? 0)
      setHasMore((data?.length ?? 0) < (count ?? 0))
      setLoading(false)
    }
    const debounce = setTimeout(load, 300)
    return () => clearTimeout(debounce)
  }, [search])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)

    const from = fighters.length
    let query = supabase.from('fighters').select('*').order('name')
    if (search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`)
    }
    const { data } = await query.range(from, from + PAGE_SIZE - 1)

    if (data && data.length > 0) {
      setFighters(prev => [...prev, ...data])
      setHasMore(from + data.length < totalCount)
    } else {
      setHasMore(false)
    }
    setLoadingMore(false)
  }, [fighters.length, loadingMore, hasMore, search, totalCount])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [loadMore, hasMore, loadingMore, loading])

  return (
    <div>
      <h1 className="text-3xl font-black mb-6 text-red-500">Fighters</h1>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search fighters..."
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors mb-2"
      />
      {!loading && (
        <p className="text-zinc-500 text-sm mb-4">
          Showing {fighters.length} of {totalCount} fighters
        </p>
      )}
      {loading ? (
        <p className="text-zinc-500">Loading fighters...</p>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {fighters.map(f => (
              <FighterCard key={f.id} fighter={f} />
            ))}
          </div>
          {fighters.length === 0 && <p className="text-zinc-500">No fighters found</p>}

          <div ref={sentinelRef} className="py-8 text-center">
            {loadingMore && <p className="text-zinc-500">Loading more fighters...</p>}
            {hasMore && !loadingMore && fighters.length > 0 && (
              <button
                onClick={loadMore}
                className="text-red-500 hover:text-red-400 text-sm"
              >
                Load more fighters
              </button>
            )}
            {!hasMore && fighters.length > 0 && (
              <p className="text-zinc-600 text-sm">All {totalCount} fighters loaded 💪</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
