'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { EventCard } from '@/components/EventCard'

const clientSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface EventsClientProps {
  initialEvents: any[]
  totalCount: number
  pageSize: number
}

export function EventsClient({ initialEvents, totalCount, pageSize }: EventsClientProps) {
  const [events, setEvents] = useState(initialEvents)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialEvents.length < totalCount)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)

    const from = events.length
    const to = from + pageSize - 1

    const { data } = await clientSupabase
      .from('events')
      .select('*')
      .order('date', { ascending: false })
      .range(from, to)

    if (data && data.length > 0) {
      setEvents(prev => [...prev, ...data])
      setHasMore(from + data.length < totalCount)
    } else {
      setHasMore(false)
    }
    setLoading(false)
  }, [events.length, loading, hasMore, pageSize, totalCount])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [loadMore, hasMore, loading])

  return (
    <>
      <p className="text-zinc-500 text-sm mb-4">
        Showing {events.length} of {totalCount} events
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {events.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="py-8 text-center">
        {loading && <p className="text-zinc-500">Loading more events...</p>}
        {hasMore && !loading && (
          <button
            onClick={loadMore}
            className="text-red-500 hover:text-red-400 text-sm"
          >
            Load more events
          </button>
        )}
        {!hasMore && events.length > 0 && (
          <p className="text-zinc-600 text-sm">That&apos;s all {totalCount} events 🥊</p>
        )}
      </div>
    </>
  )
}
