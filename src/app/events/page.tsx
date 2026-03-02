import { supabase } from '@/lib/supabase'
import { EventCard } from '@/components/EventCard'
import { Timeline } from '@/components/Timeline'

export const revalidate = 60

export default async function EventsPage() {
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false })

  const timelineItems = events?.map(event => ({
    key: event.id,
    date: new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    content: <EventCard event={event} />,
  })) ?? []

  return (
    <div>
      <h1 className="text-3xl font-black mb-8 text-red-500">Events Timeline</h1>
      <Timeline items={timelineItems} />
    </div>
  )
}
