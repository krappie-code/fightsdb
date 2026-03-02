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
    .select('*, fighter1:fighters!fighter1_id(id,name), fighter2:fighters!fighter2_id(id,name)')
    .eq('event_id', id)
    .order('card_position', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">{event.name}</h1>
        <p className="text-zinc-400 mt-1">
          {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <p className="text-zinc-500">{event.location}</p>
      </div>

      <EventFightList fights={fights ?? []} />
    </div>
  )
}
