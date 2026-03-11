import { supabase } from '@/lib/supabase'
import { UpcomingClient } from './UpcomingClient'

export const revalidate = 300 // Revalidate every 5 minutes

export default async function UpcomingPage() {
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'upcoming')
    .order('date', { ascending: true })

  return (
    <div>
      <h1 className="text-3xl font-black mb-2 text-red-500">Upcoming Events</h1>
      <p className="text-zinc-400 mb-8">Fight cards and schedules for upcoming UFC events</p>
      <UpcomingClient events={events ?? []} />
    </div>
  )
}
