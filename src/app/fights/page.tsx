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
  "Women's Strawweight", 'Flyweight', "Women's Flyweight",
  'Bantamweight', "Women's Bantamweight",
  'Featherweight', "Women's Featherweight",
  'Lightweight', 'Welterweight', 'Middleweight',
  'Light Heavyweight', 'Heavyweight',
  'Catch Weight', 'Open Weight',
]

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'oldest', label: 'Oldest First' },
]

const METHODS = ['KO/TKO', 'Submission', 'Decision', 'DQ', 'No Contest']

const PAGE_SIZE = 20

export default function FightsPage() {
  const [fights, setFights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [showAllSpoilers, setShowAllSpoilers] = useState(false)

  // Sort
  const [sortBy, setSortBy] = useState('recent')

  // Primary filters
  const [weightClass, setWeightClass] = useState('')
  const [fighterSearch, setFighterSearch] = useState('')
  const [selectedFighter, setSelectedFighter] = useState<{ id: string; name: string } | null>(null)
  const [titleOnly, setTitleOnly] = useState(false)

  // Advanced filters
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [venue, setVenue] = useState('')
  const [method, setMethod] = useState('')
  const [mainEventOnly, setMainEventOnly] = useState(false)

  // Autocomplete state
  const [venues, setVenues] = useState<string[]>([])
  const [showVenueSuggestions, setShowVenueSuggestions] = useState(false)
  const [fighterSuggestions, setFighterSuggestions] = useState<{ id: string; name: string }[]>([])
  const [showFighterSuggestions, setShowFighterSuggestions] = useState(false)

  // We store sorted event IDs to paginate properly by event date
  const [eventIds, setEventIds] = useState<string[]>([])
  const [eventPage, setEventPage] = useState(0)
  const EVENT_BATCH = 5 // fetch fights for 5 events at a time

  const sentinelRef = useRef<HTMLDivElement>(null)
  const venueRef = useRef<HTMLDivElement>(null)
  const fighterRef = useRef<HTMLDivElement>(null)

  // Load venues
  useEffect(() => {
    async function loadVenues() {
      const all: string[] = []
      let offset = 0
      while (true) {
        const { data } = await supabase.from('events').select('location').range(offset, offset + 999)
        if (!data || data.length === 0) break
        data.forEach(e => { if (e.location && !all.includes(e.location)) all.push(e.location) })
        offset += data.length
        if (data.length < 1000) break
      }
      setVenues(all.sort())
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

  // Fighter autocomplete
  useEffect(() => {
    if (!fighterSearch.trim() || selectedFighter) { setFighterSuggestions([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('fighters').select('id, name')
        .ilike('name', `%${fighterSearch.trim()}%`).order('name').limit(8)
      setFighterSuggestions(data ?? [])
      setShowFighterSuggestions(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [fighterSearch, selectedFighter])

  const hasFightFilters = !!(weightClass || titleOnly || mainEventOnly || method || selectedFighter)

  // Step 1: Fetch sorted event IDs
  // When fight-level filters are active, first find events that have matching fights
  const fetchEventIds = useCallback(async () => {
    // If fight filters are active, find which events actually have matching fights
    let matchingEventIds: Set<string> | null = null
    if (hasFightFilters) {
      let fq = supabase.from('fights').select('event_id')
      if (weightClass) fq = fq.eq('weight_class', weightClass)
      if (titleOnly) fq = fq.eq('title_fight', true)
      if (mainEventOnly) fq = fq.eq('main_event', true)
      if (method) fq = fq.eq('method', method)
      if (selectedFighter) fq = fq.or(`fighter1_id.eq.${selectedFighter.id},fighter2_id.eq.${selectedFighter.id}`)

      const eventIdSet = new Set<string>()
      let offset = 0
      while (true) {
        const { data } = await fq.range(offset, offset + 999)
        if (!data || data.length === 0) break
        data.forEach(f => eventIdSet.add(f.event_id))
        offset += data.length
        if (data.length < 1000) break
      }
      matchingEventIds = eventIdSet
    }

    // Now get events sorted by date, optionally filtered by venue
    let query = supabase.from('events').select('id')
      .order('date', { ascending: sortBy === 'oldest' })

    if (venue) {
      query = query.ilike('location', `%${venue}%`)
    }

    const allIds: string[] = []
    let offset = 0
    while (true) {
      const { data } = await query.range(offset, offset + 499)
      if (!data || data.length === 0) break
      data.forEach(e => {
        // Only include events that have matching fights (if fight filters active)
        if (!matchingEventIds || matchingEventIds.has(e.id)) {
          allIds.push(e.id)
        }
      })
      offset += data.length
      if (data.length < 500) break
    }
    return allIds
  }, [sortBy, venue, hasFightFilters, weightClass, titleOnly, mainEventOnly, method, selectedFighter])

  // Step 2: Fetch fights for a batch of event IDs
  const fetchFightsForEvents = useCallback(async (eIds: string[]) => {
    if (eIds.length === 0) return []

    let query = supabase.from('fights')
      .select('*, fighter1:fighters!fighter1_id(id,name,image_url,birth_location), fighter2:fighters!fighter2_id(id,name,image_url,birth_location), event:events!event_id(id,name,date,location)')
      .in('event_id', eIds)
      .order('card_position', { ascending: false })

    if (weightClass) query = query.eq('weight_class', weightClass)
    if (titleOnly) query = query.eq('title_fight', true)
    if (mainEventOnly) query = query.eq('main_event', true)
    if (method) query = query.eq('method', method)
    if (selectedFighter) {
      query = query.or(`fighter1_id.eq.${selectedFighter.id},fighter2_id.eq.${selectedFighter.id}`)
    }

    const { data } = await query.limit(200) // safety limit per batch
    return data ?? []
  }, [weightClass, titleOnly, mainEventOnly, method, selectedFighter])

  // Sort fights by event date within a batch
  const sortFights = useCallback((fights: any[], eIds: string[]) => {
    const orderMap = new Map(eIds.map((id, i) => [id, i]))
    return fights.sort((a, b) => {
      const orderA = orderMap.get(a.event_id) ?? 999
      const orderB = orderMap.get(b.event_id) ?? 999
      if (orderA !== orderB) return orderA - orderB
      return (b.card_position ?? 0) - (a.card_position ?? 0)
    })
  }, [])

  // Main load
  const loadFights = useCallback(async () => {
    setLoading(true)
    setFights([])
    setEventPage(0)

    const eIds = await fetchEventIds()
    setEventIds(eIds)

    if (eIds.length === 0) {
      setFights([])
      setHasMore(false)
      setLoading(false)
      return
    }

    // Fetch first batch
    const batch = eIds.slice(0, EVENT_BATCH)
    const data = await fetchFightsForEvents(batch)
    const sorted = sortFights(data, batch)

    setFights(sorted)
    setEventPage(EVENT_BATCH)
    setHasMore(EVENT_BATCH < eIds.length)
    setLoading(false)
  }, [fetchEventIds, fetchFightsForEvents, sortFights])

  // Reload on filter/sort change
  useEffect(() => { loadFights() }, [loadFights])

  // Load more
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)

    const nextBatch = eventIds.slice(eventPage, eventPage + EVENT_BATCH)
    if (nextBatch.length === 0) {
      setHasMore(false)
      setLoadingMore(false)
      return
    }

    const data = await fetchFightsForEvents(nextBatch)
    const sorted = sortFights(data, nextBatch)

    setFights(prev => [...prev, ...sorted])
    setEventPage(prev => prev + EVENT_BATCH)
    setHasMore(eventPage + EVENT_BATCH < eventIds.length)
    setLoadingMore(false)
  }, [eventIds, eventPage, loadingMore, hasMore, fetchFightsForEvents, sortFights])

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) loadMore()
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [loadMore, hasMore, loadingMore, loading])

  const filteredVenues = venue
    ? venues.filter(v => v.toLowerCase().includes(venue.toLowerCase())).slice(0, 8)
    : []

  const hasActiveFilters = weightClass || venue || selectedFighter || titleOnly || method || mainEventOnly
  const hasAdvancedFilters = venue || method || mainEventOnly

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

      {/* Primary filters row */}
      <div className="grid gap-3 md:grid-cols-4 mb-3">
        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Weight Class */}
        <select
          value={weightClass}
          onChange={(e) => setWeightClass(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
        >
          <option value="">All Weight Classes</option>
          {WEIGHT_CLASSES.map(wc => <option key={wc} value={wc}>{wc}</option>)}
        </select>

        {/* Fighter autocomplete */}
        <div ref={fighterRef} className="relative">
          <input
            type="text"
            value={selectedFighter ? selectedFighter.name : fighterSearch}
            onChange={(e) => { setFighterSearch(e.target.value); setSelectedFighter(null) }}
            onFocus={() => { if (fighterSuggestions.length) setShowFighterSuggestions(true) }}
            placeholder="Filter by fighter..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
          />
          {(selectedFighter || fighterSearch) && (
            <button onClick={() => { setFighterSearch(''); setSelectedFighter(null); setShowFighterSuggestions(false) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs">✕</button>
          )}
          {showFighterSuggestions && fighterSuggestions.length > 0 && (
            <div className="absolute z-50 top-full mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {fighterSuggestions.map(f => (
                <button key={f.id}
                  onClick={() => { setSelectedFighter(f); setFighterSearch(''); setShowFighterSuggestions(false) }}
                  className="block w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors">
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title fights only */}
        <label className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 cursor-pointer hover:border-zinc-600 transition-colors">
          <input type="checkbox" checked={titleOnly} onChange={(e) => setTitleOnly(e.target.checked)} className="accent-red-500" />
          <span className="text-sm text-zinc-300">Title fights only</span>
        </label>
      </div>

      {/* Advanced filters toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className={`text-sm mb-3 transition-colors ${hasAdvancedFilters ? 'text-red-400' : 'text-zinc-500 hover:text-zinc-300'}`}
      >
        {showAdvanced ? '▾' : '▸'} Advanced filters {hasAdvancedFilters ? `(${[venue, method, mainEventOnly].filter(Boolean).length} active)` : ''}
      </button>

      {/* Advanced filters panel */}
      {showAdvanced && (
        <div className="grid gap-3 md:grid-cols-3 mb-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
          {/* Venue autocomplete */}
          <div ref={venueRef} className="relative">
            <label className="text-xs text-zinc-500 mb-1 block">Venue / Location</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => { setVenue(e.target.value); setShowVenueSuggestions(true) }}
              onFocus={() => { if (venue) setShowVenueSuggestions(true) }}
              placeholder="e.g. Las Vegas, Nevada..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
            />
            {venue && (
              <button onClick={() => { setVenue(''); setShowVenueSuggestions(false) }}
                className="absolute right-2 top-[calc(50%+8px)] -translate-y-1/2 text-zinc-500 hover:text-white text-xs">✕</button>
            )}
            {showVenueSuggestions && filteredVenues.length > 0 && (
              <div className="absolute z-50 top-full mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {filteredVenues.map(v => (
                  <button key={v}
                    onClick={() => { setVenue(v); setShowVenueSuggestions(false) }}
                    className="block w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors">
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Method filter */}
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
            >
              <option value="">All Methods</option>
              {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Main event only */}
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">&nbsp;</label>
            <label className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 cursor-pointer hover:border-zinc-600 transition-colors">
              <input type="checkbox" checked={mainEventOnly} onChange={(e) => setMainEventOnly(e.target.checked)} className="accent-red-500" />
              <span className="text-sm text-zinc-300">Main events only</span>
            </label>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {weightClass && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded flex items-center gap-1">
              {weightClass} <button onClick={() => setWeightClass('')} className="hover:text-white">✕</button>
            </span>
          )}
          {selectedFighter && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded flex items-center gap-1">
              🥊 {selectedFighter.name} <button onClick={() => { setSelectedFighter(null); setFighterSearch('') }} className="hover:text-white">✕</button>
            </span>
          )}
          {titleOnly && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded flex items-center gap-1">
              🥇 Title fights <button onClick={() => setTitleOnly(false)} className="hover:text-white">✕</button>
            </span>
          )}
          {venue && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded flex items-center gap-1">
              📍 {venue} <button onClick={() => setVenue('')} className="hover:text-white">✕</button>
            </span>
          )}
          {method && (
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded flex items-center gap-1">
              {method} <button onClick={() => setMethod('')} className="hover:text-white">✕</button>
            </span>
          )}
          {mainEventOnly && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded flex items-center gap-1">
              ⭐ Main events <button onClick={() => setMainEventOnly(false)} className="hover:text-white">✕</button>
            </span>
          )}
          <button
            onClick={() => { setWeightClass(''); setVenue(''); setSelectedFighter(null); setFighterSearch(''); setTitleOnly(false); setMethod(''); setMainEventOnly(false) }}
            className="text-xs text-zinc-500 hover:text-white transition-colors"
          >Clear all</button>
        </div>
      )}

      {/* Results */}
      {!loading && (
        <p className="text-zinc-500 text-sm mb-4">
          {fights.length} fights loaded{hasMore ? ' — scroll for more' : ''}
        </p>
      )}

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

      <div ref={sentinelRef} className="py-8 text-center">
        {loadingMore && <p className="text-zinc-500">Loading more fights...</p>}
        {hasMore && !loadingMore && !loading && fights.length > 0 && (
          <button onClick={loadMore} className="text-red-500 hover:text-red-400 text-sm">Load more fights</button>
        )}
      </div>
    </div>
  )
}
