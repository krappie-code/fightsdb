import { supabase } from '@/lib/supabase'
import { EventsClient } from './EventsClient'

export const revalidate = 60

const PAGE_SIZE = 20

export default async function EventsPage() {
  const { data: events, count } = await supabase
    .from('events')
    .select('*', { count: 'exact' })
    .or('status.eq.completed,status.is.null')
    .order('date', { ascending: false })
    .range(0, PAGE_SIZE - 1)

  return (
    <div>
      <h1 className="text-3xl font-black mb-8 text-red-500">All Events</h1>
      <EventsClient
        initialEvents={events ?? []}
        totalCount={count ?? 0}
        pageSize={PAGE_SIZE}
      />
    </div>
  )
}
