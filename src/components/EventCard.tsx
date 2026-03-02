import Link from 'next/link'
import Image from 'next/image'

interface EventCardProps {
  event: {
    id: string
    name: string
    date: string
    location: string
    poster_url?: string
  }
  fightCount?: number
}

export function EventCard({ event, fightCount }: EventCardProps) {
  return (
    <Link href={`/events/${event.id}`}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-red-500/50 hover:bg-zinc-800/50 transition-all cursor-pointer flex">
        {/* Poster thumbnail */}
        <div className="w-24 h-36 flex-shrink-0 bg-zinc-800 relative">
          {event.poster_url ? (
            <img
              src={event.poster_url}
              alt={`${event.name} poster`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        {/* Event info */}
        <div className="p-4 flex flex-col justify-center">
          <h3 className="font-bold text-lg text-white">{event.name}</h3>
          <p className="text-zinc-400 text-sm mt-1">
            {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-zinc-500 text-sm">{event.location}</p>
          {fightCount !== undefined && (
            <p className="text-zinc-500 text-xs mt-2">{fightCount} fights</p>
          )}
        </div>
      </div>
    </Link>
  )
}
