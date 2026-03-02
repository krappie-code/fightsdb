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
  }
}

export function FighterCard({ fighter }: FighterCardProps) {
  return (
    <Link href={`/fighters/${fighter.id}`}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-red-500/50 hover:bg-zinc-800/50 transition-all cursor-pointer">
        <h3 className="font-bold text-white">{fighter.name}</h3>
        {fighter.nickname && (
          <p className="text-zinc-500 text-sm italic">&ldquo;{fighter.nickname}&rdquo;</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-sm font-mono text-zinc-300">
            {fighter.wins}-{fighter.losses}-{fighter.draws}
          </span>
          <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
            {fighter.weight_class}
          </span>
        </div>
      </div>
    </Link>
  )
}
