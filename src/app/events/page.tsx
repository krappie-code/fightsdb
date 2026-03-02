import { supabase } from '@/lib/supabase'
import { EventCard } from '@/components/EventCard'
import { Timeline } from '@/components/Timeline'

export const revalidate = 60

export default async function EventsPage() {
  // Fetch all events server-side (259 events is fine to load at once)
  // Supabase default limit is 1000, so we need to be explicit
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false })
    .limit(1000)

  const timelineItems = (events ?? []).map(event => ({
    key: event.id,
    date: new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    content: <EventCard event={event} />,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-red-500">Events Timeline</h1>
        <span className="text-sm text-zinc-500">{timelineItems.length} events</span>
      </div>
      <Timeline items={timelineItems} />
    </div>
  )
}
