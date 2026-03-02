import Link from 'next/link'

interface FighterCardProps {
  fighter: {
    id: string
    name: string
    wins: number
    losses: number
    draws: number
    weight_class: string
    nickname?: string
    image_url?: string
    birth_location?: string
  }
}

export function FighterCard({ fighter }: FighterCardProps) {
  return (
    <Link href={`/fighters/${fighter.id}`}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-red-500/50 hover:bg-zinc-800/50 transition-all cursor-pointer flex items-center gap-4">
        {/* Fighter image */}
        <div className="w-14 h-14 flex-shrink-0 rounded-full bg-zinc-800 overflow-hidden">
          {fighter.image_url ? (
            <img
              src={fighter.image_url}
              alt={fighter.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xl font-bold">
              {fighter.name.charAt(0)}
            </div>
          )}
        </div>
        {/* Info */}
        <div>
          <h3 className="font-bold text-white">{fighter.name}</h3>
          {fighter.nickname && (
            <p className="text-zinc-500 text-sm italic">&ldquo;{fighter.nickname}&rdquo;</p>
          )}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-sm font-mono text-zinc-300">
              {fighter.wins}-{fighter.losses}-{fighter.draws}
            </span>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
              {fighter.weight_class}
            </span>
            {fighter.birth_location && (
              <span className="text-xs text-zinc-400">
                {fighter.birth_location}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
