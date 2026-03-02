'use client'

import { useState } from 'react'
import { FightCard } from '@/components/FightCard'
import { SpoilerToggle } from '@/components/SpoilerToggle'

interface Props {
  fights: any[]
}

export function FighterFightList({ fights }: Props) {
  const [showAll, setShowAll] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-red-500">Fight History ({fights.length})</h2>
        <SpoilerToggle
          revealed={showAll}
          onToggle={() => setShowAll(!showAll)}
          label={showAll ? '🙈 Hide All Results' : '👁️ Show All Results'}
        />
      </div>
      <div className="grid gap-4">
        {fights.map(fight => (
          <FightCard key={fight.id} fight={fight} showSpoiler={showAll} />
        ))}
      </div>
    </div>
  )
}
