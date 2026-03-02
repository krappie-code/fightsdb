'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SpoilerToggle } from './SpoilerToggle'

interface FightCardFighter {
  id: string
  name: string
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
  }
  showSpoiler?: boolean
}

export function FightCard({ fight, showSpoiler = false }: FightCardProps) {
  const [revealed, setRevealed] = useState(showSpoiler)

  // Determine winner name
  const winnerName = fight.result === 'Win' ? fight.fighter1.name : 
    fight.result === 'Loss' ? fight.fighter2.name : null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors">
      {/* Tags */}
      <div className="flex items-center gap-2 mb-3">
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

      {/* Fighters */}
      <div className="flex items-center justify-between mb-3">
        <Link href={`/fighters/${fight.fighter1.id}`} className="font-bold text-white hover:text-red-400 transition-colors text-lg">
          {fight.fighter1.name}
        </Link>
        <span className="text-zinc-600 font-black text-xl mx-4">VS</span>
        <Link href={`/fighters/${fight.fighter2.id}`} className="font-bold text-white hover:text-red-400 transition-colors text-lg text-right">
          {fight.fighter2.name}
        </Link>
      </div>

      {/* Result / Spoiler */}
      {fight.result ? (
        revealed ? (
          <div className="bg-zinc-800 rounded-lg p-3 text-sm">
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
        <p className="text-zinc-600 text-sm italic">No result recorded</p>
      )}
    </div>
  )
}
