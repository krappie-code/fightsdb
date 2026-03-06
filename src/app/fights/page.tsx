'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { FightCard } from '@/components/FightCard'
import { SpoilerToggle } from '@/components/SpoilerToggle'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const WEIGHT_CLASSES = [
  'Strawweight', "Women's Strawweight",
  'Flyweight', "Women's Flyweight",
  'Bantamweight', "Women's Bantamweight",
  'Featherweight', "Women's Featherweight",
  'Lightweight',
  'Welterweight',
  'Middleweight',
  'Light Heavyweight',
  'Heavyweight',
  'Catch Weight',
  'Open Weight',
  'Super Heavyweight',
]

const PAGE_SIZE = 20

export default function FightsPage() {
  const [fights, setFights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [showAllSpoilers, setShowAllSpoilers] = useState(false)

  // Filters
  const [weightClass, setWeightClass] = useState('')
  const [venue, setVenue] = useState('')
  const [fighterSearch, setFighterSearch] = useState('')
  const [titleOnly, setTitleOnly] = useState(false)

  // Venue suggestions
  const [venues, setVenues] = useState<string[]>([])
  const [showVenueSuggestions, setShowVenueSuggestions] = useState(false)

  // Fighter suggestions
  const [fighterSuggestions, setFighterSuggestions] = useState<{ id: string; name: string }[]>([])
  const [selectedFighter, setSelectedFighter] = useState<{ id: string; name: string } | null>(null)
  const [showFighterSuggestions, setShowFighterSuggestions] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const venueRef = useRef<HTMLDivElement>(null)
  const fighterRef = useRef<HTMLDivElement>(null)

  // Load venues for autocomplete
  useEffect(() => {
    async function loadVenues() {
      const allVenues: string[] = []
      let offset = 0
      while (true) {
        const { data } = await supabase
          .from('events')
          .select('location')
          .range(offset, offset + 999)
        if (!data || data.length === 0) break
        data.forEach(e => { if (e.location && !allVenues.includes(e.location)) allVenues.push(e.location) })
        offset += data.length
        if (data.length < 1000) break
      }
      setVenues(allVenues.sort())
    }
    loadVenues()
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (venueRef.current && !venueRef.current.contains(e.target as Node)) setShowVenueSuggestions(false)
      if (fighterRef.current && !fighterRef.current.contains(e.target as Node)) setShowFighterSuggestions(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Fighter search autocomplete
  useEffect(() => {
    if (!fighterSearch.trim() || selectedFighter) {
      setFighterSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('fighters')
        .select('id, name')
        .ilike('name', `%${fighterSearch.trim()}%`)
        .order('name')
        .limit(8)
      setFighterSuggestions(data ?? [])
      setShowFighterSuggestions(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [fighterSearch, selectedFighter])

  // Build and run query
  const buildQuery = useCallback((countOnly: boolean, from: number, to: number) => {
    let query = supabase
      .from('fights')
      .select(
        countOnly
          ? '*'
          : '*, fighter1:fighters!fighter1_id(id,name,image_url,birth_location), fighter2:fighters!fighter2_id(id,name,image_url,birth_location), event:events!event_id(id,name,date,location)',
        countOnly ? { count: 'exact', head: true } : { count: 'exact' }
      )

    if (weightClass) {
      query = query.eq('weight_class', weightClass)
    }
    if (titleOnly) {
      query = query.eq('title_fight', true)
    }
    if (selectedFighter) {
      query = query.or(`fighter1_id.eq.${selectedFighter.id},fighter2_id.eq.${selectedFighter.id}`)
    }

    if (!countOnly) {
      // We need to order by event date (descending), then card_position (descending)
      // Since we join events, we can't directly order by event.date via Supabase client easily
      // We'll order by created_at desc as a proxy, or use event_id ordering
      query = query
        .order('created_at', { ascending: false })
        .range(from, to)
    }

    return query
  }, [weightClass, titleOnly, selectedFighter])

  // Load fights
  const loadFights = useCallback(async () => {
    setLoading(true)
    setFights([])

    const query = buildQuery(false, 0, PAGE_SIZE - 1)
    const { data, count } = await query

    // If venue filter is set, filter client-side (venue is on the event join)
    let filtered = data ?? []
    if (venue) {
      filtered = filtered.filter((f: any) =>
        f.event?.location?.toLowerCase().includes(venue.toLowerCase())
      )
    }

    setFights(filtered)
    setTotalCount(count ?? 0)
    setHasMore((data?.length ?? 0) >= PAGE_SIZE)
    setLoading(false)
  }, [buildQuery, venue])

  // Reload on filter change
  useEffect(() => {
    loadFights()
  }, [loadFights])

  // Load more
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)

    const from = fights.length
    const query = buildQuery(false, from, from + PAGE_SIZE - 1)
    const { data } = await query

    if (data && data.length > 0) {
      let filtered = data
      if (venue) {
        filtered = filtered.filter((f: any) =>
          f.event?.location?.toLowerCase().includes(venue.toLowerCase())
        )
      }
      setFights(prev => [...prev, ...filtered])
      setHasMore(data.length >= PAGE_SIZE)
    } else {
      setHasMore(false)
    }
    setLoadingMore(false)
  }, [fights.length, loadingMore, hasMore, buildQuery, venue])

  // Infinite scroll
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

  const filteredVenues = venue
    ? venues.filter(v => v.toLowerCase().includes(venue.toLowerCase())).slice(0, 8)
    : []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black text-red-500">Fights</h1>
        <SpoilerToggle
          revealed={showAllSpoilers}
          onToggle={() => setShowAllSpoilers(!showAllSpoilers)}
          label={showAllSpoilers ? '🙈 Hide All Results' : '👁️ Show All Results'}
        />
      </div>

      {/* Filters */}
      <div className="grid gap-3 md:grid-cols-4 mb-6">
        {/* Weight Class */}
        <select
          value={weightClass}
          onChange={(e) => setWeightClass(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
        >
          <option value="">All Weight Classes</option>
          {WEIGHT_CLASSES.map(wc => (
            <option key={wc} value={wc}>{wc}</option>
          ))}
        </select>

        {/* Venue autocomplete */}
        <div ref={venueRef} className="relative">
          <input
            type="text"
            value={venue}
            onChange={(e) => { setVenue(e.target.value); setShowVenueSuggestions(true) }}
            onFocus={() => { if (venue) setShowVenueSuggestions(true) }}
            placeholder="Filter by venue..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
          />
          {venue && (
            <button
              onClick={() => { setVenue(''); setShowVenueSuggestions(false) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
            >✕</button>
          )}
          {showVenueSuggestions && filteredVenues.length > 0 && (
            <div className="absolute z-50 top-full mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {filteredVenues.map(v => (
                <button
                  key={v}
                  onClick={() => { setVenue(v); setShowVenueSuggestions(false) }}
                  className="block w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fighter autocomplete */}
        <div ref={fighterRef} className="relative">
          <input
            type="text"
            value={selectedFighter ? selectedFighter.name : fighterSearch}
            onChange={(e) => {
              setFighterSearch(e.target.value)
              setSelectedFighter(null)
            }}
            onFocus={() => { if (fighterSuggestions.length) setShowFighterSuggestions(true) }}
            placeholder="Filter by fighter..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
          />
          {(selectedFighter || fighterSearch) && (
            <button
              onClick={() => { setFighterSearch(''); setSelectedFighter(null); setShowFighterSuggestions(false) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
            >✕</button>
          )}
          {showFighterSuggestions && fighterSuggestions.length > 0 && (
            <div className="absolute z-50 top-full mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {fighterSuggestions.map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    setSelectedFighter(f)
                    setFighterSearch('')
                    setShowFighterSuggestions(false)
                  }}
                  className="block w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title fights only */}
        <label className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 cursor-pointer hover:border-zinc-600 transition-colors">
          <input
            type="checkbox"
            checked={titleOnly}
            onChange={(e) => setTitleOnly(e.target.checked)}
            className="accent-red-500"
          />
          <span className="text-sm text-zinc-300">Title fights only</span>
        </label>
      </div>

      {/* Active filters */}
      {(weightClass || venue || selectedFighter || titleOnly) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {weightClass && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded flex items-center gap-1">
              {weightClass}
              <button onClick={() => setWeightClass('')} className="hover:text-white">✕</button>
            </span>
          )}
          {venue && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded flex items-center gap-1">
              📍 {venue}
              <button onClick={() => setVenue('')} className="hover:text-white">✕</button>
            </span>
          )}
          {selectedFighter && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded flex items-center gap-1">
              🥊 {selectedFighter.name}
              <button onClick={() => { setSelectedFighter(null); setFighterSearch('') }} className="hover:text-white">✕</button>
            </span>
          )}
          {titleOnly && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded flex items-center gap-1">
              🥇 Title fights
              <button onClick={() => setTitleOnly(false)} className="hover:text-white">✕</button>
            </span>
          )}
          <button
            onClick={() => { setWeightClass(''); setVenue(''); setSelectedFighter(null); setFighterSearch(''); setTitleOnly(false) }}
            className="text-xs text-zinc-500 hover:text-white transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results count */}
      {!loading && (
        <p className="text-zinc-500 text-sm mb-4">
          Showing {fights.length}{totalCount ? ` of ${totalCount.toLocaleString()}` : ''} fights
        </p>
      )}

      {/* Fight list */}
      {loading ? (
        <p className="text-zinc-500 py-8 text-center">Loading fights...</p>
      ) : fights.length === 0 ? (
        <p className="text-zinc-500 py-8 text-center">No fights found matching your filters</p>
      ) : (
        <div className="grid gap-4">
          {fights.map(fight => (
            <FightCard key={fight.id} fight={fight} showSpoiler={showAllSpoilers} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="py-8 text-center">
        {loadingMore && <p className="text-zinc-500">Loading more fights...</p>}
        {hasMore && !loadingMore && !loading && fights.length > 0 && (
          <button onClick={loadMore} className="text-red-500 hover:text-red-400 text-sm">
            Load more fights
          </button>
        )}
      </div>
    </div>
  )
}
