import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { EventCard } from '@/components/EventCard'
import { Timeline } from '@/components/Timeline'

export const revalidate = 60

export default async function HomePage() {
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false })
    .limit(10)

  // Get fight counts per event
  const eventIds = events?.map(e => e.id) ?? []
  const { data: fights } = await supabase
    .from('fights')
    .select('event_id')
    .in('event_id', eventIds)

  const fightCounts: Record<string, number> = {}
  fights?.forEach(f => {
    fightCounts[f.event_id] = (fightCounts[f.event_id] || 0) + 1
  })

  const timelineItems = events?.map(event => ({
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
        <p className="text-zinc-400 text-xl mt-4">Browse UFC fights spoiler-free</p>
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
            Browse all 763 events →
          </Link>
        </div>
      </section>
    </div>
  )
}
