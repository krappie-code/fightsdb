'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const clientSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface UpcomingClientProps {
  events: any[]
}

function daysUntil(dateStr: string): number {
  const eventDate = new Date(dateStr + 'T00:00:00Z')
  const now = new Date()
  const diff = eventDate.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatCountdown(days: number): string {
  if (days === 0) return 'Today!'
  if (days === 1) return 'Tomorrow'
  if (days < 7) return `${days} days`
  if (days < 14) return '1 week'
  return `${Math.floor(days / 7)} weeks`
}

interface FightCardProps {
  eventId: string
}

function FightCard({ eventId }: FightCardProps) {
  const [fights, setFights] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const loadFights = async () => {
    if (fights !== null) {
      setExpanded(!expanded)
      return
    }
    setLoading(true)
    const { data } = await clientSupabase
      .from('fights')
      .select('*, fighter1:fighters!fighter1_id(id,name,image_url), fighter2:fighters!fighter2_id(id,name,image_url)')
      .eq('event_id', eventId)
      .order('main_event', { ascending: false })
      .order('created_at', { ascending: true })

    setFights(data || [])
    setExpanded(true)
    setLoading(false)
  }

  return (
    <div>
      <button
        onClick={loadFights}
        className="text-sm text-red-400 hover:text-red-300 transition-colors mt-3 flex items-center gap-1"
      >
        {loading ? (
          <span className="animate-pulse">Loading fight card...</span>
        ) : expanded ? (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            Hide fight card
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            View fight card ({fights?.length || '...'})
          </>
        )}
      </button>

      {expanded && fights && fights.length > 0 && (
        <div className="mt-3 space-y-2">
          {fights.map((fight: any, idx: number) => (
            <div
              key={fight.id}
              className={`flex items-center gap-3 py-2 px-3 rounded-lg ${
                idx === 0 ? 'bg-red-500/10 border border-red-500/20' : 'bg-zinc-800/50'
              }`}
            >
              {idx === 0 && (
                <span className="text-[10px] font-bold uppercase text-red-400 tracking-wider">Main</span>
              )}
              <div className="flex-1 flex items-center justify-between text-sm">
                <Link href={`/fighters/${fight.fighter1?.id}`} className="text-white hover:text-red-400 transition-colors font-medium">
                  {fight.fighter1?.name}
                </Link>
                <span className="text-zinc-500 text-xs px-2">vs</span>
                <Link href={`/fighters/${fight.fighter2?.id}`} className="text-white hover:text-red-400 transition-colors font-medium text-right">
                  {fight.fighter2?.name}
                </Link>
              </div>
              {fight.weight_class && (
                <span className="text-[10px] text-zinc-500 whitespace-nowrap">{fight.weight_class}</span>
              )}
              {fight.title_fight && (
                <span className="text-[10px]">🏆</span>
              )}
            </div>
          ))}
        </div>
      )}

      {expanded && fights && fights.length === 0 && (
        <p className="text-zinc-500 text-sm mt-2 italic">Fight card not yet announced</p>
      )}
    </div>
  )
}

export function UpcomingClient({ events }: UpcomingClientProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-20 text-zinc-500">
        <p className="text-lg">No upcoming events found</p>
        <p className="text-sm mt-2">Check back later for new events</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        const days = daysUntil(event.date)
        const isThisWeek = days >= 0 && days <= 7
        const isPast = days < 0

        return (
          <div
            key={event.id}
            className={`bg-zinc-900 border rounded-lg overflow-hidden transition-all ${
              isThisWeek ? 'border-red-500/50 shadow-lg shadow-red-500/5' : 'border-zinc-800'
            }`}
          >
            <div className="flex">
              {/* Poster or placeholder */}
              <div className="w-28 h-40 flex-shrink-0 bg-zinc-800 relative">
                {event.poster_url ? (
                  <img
                    src={event.poster_url}
                    alt={`${event.name} poster`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl">🥊</span>
                  </div>
                )}
              </div>

              {/* Event info */}
              <div className="p-4 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/events/${event.id}`}>
                      <h2 className="font-bold text-lg text-white hover:text-red-400 transition-colors">
                        {event.name}
                      </h2>
                    </Link>
                    <p className="text-zinc-400 text-sm mt-1">
                      {new Date(event.date + 'T00:00:00Z').toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    {event.location && (
                      <p className="text-zinc-500 text-sm">{event.location}</p>
                    )}
                  </div>

                  {/* Countdown badge */}
                  {!isPast && (
                    <div className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold ${
                      days === 0
                        ? 'bg-red-500 text-white animate-pulse'
                        : isThisWeek
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {formatCountdown(days)}
                    </div>
                  )}
                </div>

                {/* Expandable fight card */}
                <FightCard eventId={event.id} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
