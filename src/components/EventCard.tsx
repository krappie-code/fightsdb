import Link from 'next/link'

interface EventCardProps {
  event: {
    id: string
    name: string
    date: string
    location: string
  }
  fightCount?: number
}

export function EventCard({ event, fightCount }: EventCardProps) {
  return (
    <Link href={`/events/${event.id}`}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-red-500/50 hover:bg-zinc-800/50 transition-all cursor-pointer">
        <h3 className="font-bold text-lg text-white">{event.name}</h3>
        <p className="text-zinc-400 text-sm mt-1">
          {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <p className="text-zinc-500 text-sm">{event.location}</p>
        {fightCount !== undefined && (
          <p className="text-zinc-500 text-xs mt-2">{fightCount} fights</p>
        )}
      </div>
    </Link>
  )
}
