import { supabase } from '@/lib/supabase'
import { EventCard } from '@/components/EventCard'

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
        <h2 className="text-2xl font-bold mb-6 text-red-500">Recent Events</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {events?.map(event => (
            <EventCard key={event.id} event={event} fightCount={fightCounts[event.id]} />
          ))}
        </div>
      </section>
    </div>
  )
}
