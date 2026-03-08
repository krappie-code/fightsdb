import { supabase } from '@/lib/supabase'
import { EventFightList } from './EventFightList'

export const revalidate = 60

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (!event) return <div className="text-center py-20 text-zinc-500">Event not found</div>

  const { data: fights } = await supabase
    .from('fights')
    .select('*, fighter1:fighters!fighter1_id(id,name,image_url,birth_location), fighter2:fighters!fighter2_id(id,name,image_url,birth_location)')
    .eq('event_id', id)
    .order('main_event', { ascending: false })
    .order('created_at', { ascending: true })

  return (
    <div>
      <div className="mb-8 flex gap-6">
        {event.poster_url && (
          <img src={event.poster_url} alt={`${event.name} poster`} className="w-40 h-auto rounded-lg shadow-lg flex-shrink-0" />
        )}
        <div>
          <h1 className="text-3xl font-black text-white">{event.name}</h1>
          <p className="text-zinc-400 mt-1">
            {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-zinc-500">{event.location}</p>
        </div>
      </div>

      <EventFightList fights={fights ?? []} />
    </div>
  )
}
