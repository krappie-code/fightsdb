'use client'

import { useState } from 'react'
import { FightCard } from '@/components/FightCard'
import { SpoilerToggle } from '@/components/SpoilerToggle'
import { Timeline } from '@/components/Timeline'

interface Props {
  fights: any[]
}

export function FighterFightList({ fights }: Props) {
  const [showAll, setShowAll] = useState(false)

  const timelineItems = fights.map(fight => ({
    key: fight.id,
    date: fight.event?.date
      ? new Date(fight.event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : 'Unknown date',
    content: <FightCard fight={fight} showSpoiler={showAll} />,
  }))

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
      <Timeline items={timelineItems} />
    </div>
  )
}
