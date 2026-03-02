'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { EventCard } from '@/components/EventCard'
import { Timeline } from '@/components/Timeline'

const PAGE_SIZE = 20

// Client-side Supabase instance
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function EventsClient({ initialEvents }: { initialEvents: any[] }) {
  const [events, setEvents] = useState<any[]>(initialEvents)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialEvents.length === PAGE_SIZE)
  const loadingRef = useRef(false)
  const observerRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return
    loadingRef.current = true
    setLoadingMore(true)

    const offset = events.length
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    const newEvents = data ?? []
    setEvents(prev => [...prev, ...newEvents])
    setHasMore(newEvents.length === PAGE_SIZE)
    setLoadingMore(false)
    loadingRef.current = false
  }, [events.length, hasMore])

  // Intersection Observer
  useEffect(() => {
    const el = observerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { threshold: 0, rootMargin: '400px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  const timelineItems = events.map(event => ({
    key: event.id,
    date: new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    content: <EventCard event={event} />,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-red-500">Events Timeline</h1>
        <span className="text-sm text-zinc-500">{events.length} events</span>
      </div>

      <Timeline items={timelineItems} />

      <div ref={observerRef} className="py-8 text-center">
        {loadingMore && (
          <p className="text-zinc-500 animate-pulse">Loading more events...</p>
        )}
        {hasMore && !loadingMore && (
          <button
            onClick={loadMore}
            className="text-sm text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded transition-colors"
          >
            Load more events
          </button>
        )}
        {!hasMore && events.length > 0 && (
          <p className="text-zinc-600 text-sm">All {events.length} events loaded</p>
        )}
      </div>
    </div>
  )
}
