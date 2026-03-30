import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { EventCard } from '@/components/EventCard'
import { Timeline } from '@/components/Timeline'
import { UniversalSearch } from '@/components/UniversalSearch'

export const revalidate = 60

export default async function HomePage() {
  // Recent completed events
  const { data: recentEvents, count: totalCompleted } = await supabase
    .from('events')
    .select('*', { count: 'exact' })
    .or('status.eq.completed,status.is.null')
    .order('date', { ascending: false })
    .limit(10)

  // Upcoming events
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'upcoming')
    .order('date', { ascending: true })
    .limit(5)

  // Get fight counts for recent events
  const recentIds = recentEvents?.map(e => e.id) ?? []
  const { data: recentFights } = await supabase
    .from('fights')
    .select('event_id')
    .in('event_id', recentIds)

  const fightCounts: Record<string, number> = {}
  recentFights?.forEach(f => {
    fightCounts[f.event_id] = (fightCounts[f.event_id] || 0) + 1
  })

  const timelineItems = recentEvents?.map(event => ({
    key: event.id,
    date: new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    content: <EventCard event={event} fightCount={fightCounts[event.id]} />,
  })) ?? []

  return (
    <div>
      {/* Hero */}
      <div className="text-center py-16">
        <h1 className="text-5xl md:text-7xl font-black tracking-tight">
          Fights<span className="text-red-500">DB</span>
        </h1>
        <p className="text-zinc-400 text-xl mt-4 mb-8">Browse UFC fights spoiler-free</p>
        <UniversalSearch />
      </div>

      {/* Recent Events */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-red-500">Recent Events</h2>
          <Link
            href="/events"
            className="text-sm text-zinc-400 hover:text-red-500 transition-colors"
          >
            View all events →
          </Link>
        </div>
        <Timeline items={timelineItems} />
        <div className="text-center mt-8">
          <Link
            href="/events"
            className="inline-block px-6 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white hover:border-red-500/50 hover:bg-zinc-800/80 transition-all"
          >
            Browse all {totalCompleted ?? 0} events →
          </Link>
        </div>
      </section>

      {/* Upcoming Events */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-red-500">Upcoming Events</h2>
            <Link
              href="/upcoming"
              className="text-sm text-zinc-400 hover:text-red-500 transition-colors"
            >
              View all upcoming →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingEvents.map(event => {
              const eventDate = new Date(event.date + 'T00:00:00Z')
              const now = new Date()
              const days = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              const isThisWeek = days >= 0 && days <= 7

              return (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <div className={`bg-zinc-900 border rounded-lg p-4 hover:bg-zinc-800/50 transition-all cursor-pointer ${
                    isThisWeek ? 'border-red-500/50' : 'border-zinc-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-white">{event.name}</h3>
                        <p className="text-zinc-400 text-sm mt-1">
                          {eventDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        {event.location && (
                          <p className="text-zinc-500 text-xs mt-0.5">{event.location}</p>
                        )}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        days === 0
                          ? 'bg-red-500 text-white'
                          : isThisWeek
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : days < 7 ? `${days} days` : `${Math.floor(days / 7)}w`}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
