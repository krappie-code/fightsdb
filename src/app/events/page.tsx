'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { EventCard } from '@/components/EventCard'
import { Timeline } from '@/components/Timeline'

const PAGE_SIZE = 20

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<HTMLDivElement>(null)

  const loadEvents = useCallback(async (offset: number) => {
    const isInitial = offset === 0
    if (isInitial) setLoading(true)
    else setLoadingMore(true)

    const { data } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    const newEvents = data ?? []

    if (isInitial) {
      setEvents(newEvents)
    } else {
      setEvents(prev => [...prev, ...newEvents])
    }

    setHasMore(newEvents.length === PAGE_SIZE)
    setLoading(false)
    setLoadingMore(false)
  }, [])

  useEffect(() => {
    loadEvents(0)
  }, [loadEvents])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!observerRef.current || !hasMore || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadEvents(events.length)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [events.length, hasMore, loadingMore, loadEvents])

  const timelineItems = events.map(event => ({
    key: event.id,
    date: new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    content: <EventCard event={event} />,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-red-500">Events Timeline</h1>
        <span className="text-sm text-zinc-500">{events.length} events loaded</span>
      </div>

      {loading ? (
        <div className="text-center py-20 text-zinc-500">Loading events...</div>
      ) : (
        <>
          <Timeline items={timelineItems} />

          {/* Infinite scroll trigger */}
          <div ref={observerRef} className="py-8 text-center">
            {loadingMore && (
              <p className="text-zinc-500">Loading more events...</p>
            )}
            {!hasMore && events.length > 0 && (
              <p className="text-zinc-600 text-sm">All events loaded</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
