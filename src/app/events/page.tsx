import { supabase } from '@/lib/supabase'
import { EventsClient } from './EventsClient'

export const revalidate = 60

export default async function EventsPage() {
  // Server-side initial load
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false })
    .range(0, 19)

  return <EventsClient initialEvents={events ?? []} />
}
