import { supabase } from '@/lib/supabase'
import { EventCard } from '@/components/EventCard'

export const revalidate = 60

export default async function EventsPage() {
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-black mb-8 text-red-500">All Events</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {events?.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}
