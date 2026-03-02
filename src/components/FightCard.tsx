'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SpoilerToggle } from './SpoilerToggle'

interface FightCardFighter {
  id: string
  name: string
  image_url?: string
  birth_location?: string
}

interface FightCardProps {
  fight: {
    id: string
    weight_class: string
    title_fight: boolean
    main_event: boolean
    result?: string
    method?: string
    method_detail?: string
    round?: number
    time?: string
    bonuses?: string[]
    fighter1_id: string
    fighter2_id: string
    fighter1: FightCardFighter
    fighter2: FightCardFighter
    event?: { id: string; name: string; date: string }
  }
  showSpoiler?: boolean
}

function FighterAvatar({ fighter, side }: { fighter: FightCardFighter; side: 'left' | 'right' }) {
  return (
    <Link href={`/fighters/${fighter.id}`} className={`flex flex-col items-center gap-2 group ${side === 'right' ? 'text-right' : 'text-left'}`}>
      <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden border-2 border-zinc-700 group-hover:border-red-500 transition-colors">
        {fighter.image_url ? (
          <img src={fighter.image_url} alt={fighter.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500 text-lg font-bold">
            {fighter.name.charAt(0)}
          </div>
        )}
      </div>
      <span className="font-bold text-white group-hover:text-red-400 transition-colors text-sm text-center leading-tight max-w-[120px]">
        {fighter.name}
      </span>
      {fighter.birth_location && (
        <span className="text-zinc-500 text-xs text-center">{fighter.birth_location}</span>
      )}
    </Link>
  )
}

export function FightCard({ fight, showSpoiler = false }: FightCardProps) {
  const [revealed, setRevealed] = useState(showSpoiler)

  const winnerName = fight.result === 'Win' ? fight.fighter1.name : 
    fight.result === 'Loss' ? fight.fighter2.name : null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors">
      {/* Event link */}
      {fight.event && (
        <Link href={`/events/${fight.event.id}`} className="block mb-3 group/event">
          <span className="text-sm text-zinc-400 group-hover/event:text-red-400 transition-colors">
            📅 {fight.event.name}
          </span>
        </Link>
      )}

      {/* Tags */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{fight.weight_class}</span>
        {fight.title_fight && (
          <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded font-semibold">🏆 TITLE</span>
        )}
        {fight.main_event && (
          <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded font-semibold">MAIN EVENT</span>
        )}
        {fight.bonuses?.map((b) => (
          <span key={b} className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">💰 {b}</span>
        ))}
      </div>

      {/* Fighters with images */}
      <div className="flex items-center justify-between mb-4">
        <FighterAvatar fighter={fight.fighter1} side="left" />
        <span className="text-zinc-600 font-black text-2xl mx-4">VS</span>
        <FighterAvatar fighter={fight.fighter2} side="right" />
      </div>

      {/* Result / Spoiler */}
      {fight.result ? (
        revealed ? (
          <div className="bg-zinc-800 rounded-lg p-3 text-sm text-center">
            {winnerName && (
              <p className="text-green-400 font-semibold">🏆 {winnerName} wins</p>
            )}
            {!winnerName && fight.result && (
              <p className="text-zinc-300 font-semibold">{fight.result}</p>
            )}
            <p className="text-zinc-400 mt-1">
              {fight.method}{fight.method_detail ? ` (${fight.method_detail})` : ''} • Round {fight.round} • {fight.time}
            </p>
          </div>
        ) : (
          <SpoilerToggle revealed={false} onToggle={() => setRevealed(true)} />
        )
      ) : (
        <p className="text-zinc-600 text-sm italic text-center">No result recorded</p>
      )}
    </div>
  )
}
