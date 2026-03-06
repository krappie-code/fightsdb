'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface SearchResult {
  type: 'fighter' | 'event' | 'fight'
  id: string
  title: string
  subtitle: string
  href: string
  icon: string
}

export function UniversalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Close on outside click/touch
  useEffect(() => {
    function handleClick(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [])

  // Search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }

    const timer = setTimeout(async () => {
      setLoading(true)
      const q = query.trim()
      const searchResults: SearchResult[] = []

      // Search fighters
      const { data: fighters } = await supabase
        .from('fighters')
        .select('id, name, weight_class')
        .ilike('name', `%${q}%`)
        .order('name')
        .limit(5)

      fighters?.forEach(f => {
        searchResults.push({
          type: 'fighter',
          id: f.id,
          title: f.name,
          subtitle: f.weight_class || 'Fighter',
          href: `/fighters/${f.id}`,
          icon: '👤',
        })
      })

      // Search events
      const { data: events } = await supabase
        .from('events')
        .select('id, name, date, location')
        .ilike('name', `%${q}%`)
        .order('date', { ascending: false })
        .limit(5)

      events?.forEach(e => {
        const date = new Date(e.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        searchResults.push({
          type: 'event',
          id: e.id,
          title: e.name,
          subtitle: `${date} • ${e.location}`,
          href: `/events/${e.id}`,
          icon: '🏟️',
        })
      })

      // Search fights (by fighter names in the fight)
      // Get matching fighter IDs first, then their fights
      if (fighters && fighters.length > 0) {
        const fighterIds = fighters.map(f => f.id)
        const { data: fights } = await supabase
          .from('fights')
          .select('id, weight_class, event:events!event_id(id, name, date), fighter1:fighters!fighter1_id(name), fighter2:fighters!fighter2_id(name)')
          .or(fighterIds.map(id => `fighter1_id.eq.${id}`).join(',') + ',' + fighterIds.map(id => `fighter2_id.eq.${id}`).join(','))
          .order('created_at', { ascending: false })
          .limit(5)

        fights?.forEach((f: any) => {
          const eventDate = f.event?.date
            ? new Date(f.event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
            : ''
          searchResults.push({
            type: 'fight',
            id: f.id,
            title: `${f.fighter1?.name} vs ${f.fighter2?.name}`,
            subtitle: [f.weight_class, f.event?.name, eventDate].filter(Boolean).join(' • '),
            href: `/events/${f.event?.id}`,
            icon: '🥊',
          })
        })
      }

      setResults(searchResults)
      setSelectedIndex(-1)
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault()
      router.push(results[selectedIndex].href)
      setFocused(false)
      setQuery('')
    } else if (e.key === 'Escape') {
      setFocused(false)
      inputRef.current?.blur()
    }
  }

  const showDropdown = focused && query.trim().length > 0

  // Group results by type
  const grouped = {
    fighter: results.filter(r => r.type === 'fighter'),
    event: results.filter(r => r.type === 'event'),
    fight: results.filter(r => r.type === 'fight'),
  }
  const groupLabels = { fighter: 'Fighters', event: 'Events', fight: 'Fights' }
  let globalIndex = 0

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search fighters, events, fights..."
          className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl pl-11 pr-4 py-4 text-white text-lg placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:bg-zinc-800 transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
          >✕</button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 top-full mt-2 w-full bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto pointer-events-auto" style={{ isolation: 'isolate' }}>
          {loading && results.length === 0 && (
            <div className="px-4 py-6 text-center text-zinc-500">Searching...</div>
          )}

          {!loading && results.length === 0 && query.trim() && (
            <div className="px-4 py-6 text-center text-zinc-500">No results for &ldquo;{query}&rdquo;</div>
          )}

          {(['fighter', 'event', 'fight'] as const).map(type => {
            const items = grouped[type]
            if (items.length === 0) return null
            return (
              <div key={type}>
                <div className="px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-900/80 sticky top-0">
                  {groupLabels[type]}
                </div>
                {items.map(item => {
                  const idx = globalIndex++
                  return (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={item.href}
                      onMouseDown={(e) => e.preventDefault()}
                      onTouchEnd={(e) => {
                        e.preventDefault()
                        setFocused(false)
                        setQuery('')
                        router.push(item.href)
                      }}
                      onClick={() => { setFocused(false); setQuery('') }}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                        idx === selectedIndex
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                      }`}
                    >
                      <span className="text-lg flex-shrink-0">{item.icon}</span>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{item.title}</p>
                        <p className="text-xs text-zinc-500 truncate">{item.subtitle}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
