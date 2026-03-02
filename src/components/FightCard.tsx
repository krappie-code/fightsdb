'use client'

import { useState } from 'react'
import { Fight, Fighter, Event } from '@/types/database'

interface FightCardProps {
  fight: Fight & {
    fighter1: Fighter
    fighter2: Fighter
    event: Event
  }
  spoilerProtection: boolean
}

export function FightCard({ fight, spoilerProtection }: FightCardProps) {
  const [showResult, setShowResult] = useState(!spoilerProtection)

  const formatRecord = (fighter: Fighter) => {
    return `${fighter.wins}-${fighter.losses}-${fighter.draws}`
  }

  const getResultDisplay = () => {
    if (!fight.result || !showResult) return null
    
    const resultClass = fight.result === 'Win' 
      ? 'text-green-600 bg-green-50' 
      : fight.result === 'Loss'
      ? 'text-red-600 bg-red-50'
      : 'text-gray-600 bg-gray-50'
    
    return (
      <div className={`text-xs px-2 py-1 rounded-full ${resultClass}`}>
        {fight.method} • R{fight.round} {fight.time}
      </div>
    )
  }

  const getBonusDisplay = () => {
    if (!fight.bonuses || fight.bonuses.length === 0) return null
    
    return (
      <div className="flex gap-1">
        {fight.bonuses.map((bonus) => (
          <span 
            key={bonus}
            className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full"
          >
            {bonus}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      {/* Event Info */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{fight.event.name}</h3>
          <p className="text-xs text-gray-500">{fight.event.date} • {fight.event.location}</p>
        </div>
        {fight.title_fight && (
          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-semibold">
            TITLE FIGHT
          </span>
        )}
        {fight.main_event && (
          <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full font-semibold">
            MAIN EVENT
          </span>
        )}
      </div>

      {/* Fighters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-lg">{fight.fighter1.name}</h4>
            {fight.fighter1.nickname && (
              <span className="text-sm text-gray-600 italic">"{fight.fighter1.nickname}"</span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {formatRecord(fight.fighter1)} • {fight.fighter1.weight_class}
          </p>
        </div>
        
        <div className="mx-4 text-center">
          <div className="text-2xl font-bold text-gray-400">VS</div>
          <div className="text-xs text-gray-500 mt-1">{fight.weight_class}</div>
        </div>
        
        <div className="flex-1 text-right">
          <div className="flex items-center justify-end gap-2">
            <h4 className="font-bold text-lg">{fight.fighter2.name}</h4>
            {fight.fighter2.nickname && (
              <span className="text-sm text-gray-600 italic">"{fight.fighter2.nickname}"</span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {formatRecord(fight.fighter2)} • {fight.fighter2.weight_class}
          </p>
        </div>
      </div>

      {/* Result & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {spoilerProtection && !showResult ? (
            <button
              onClick={() => setShowResult(true)}
              className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              Show Result 👁️
            </button>
          ) : (
            getResultDisplay()
          )}
          {getBonusDisplay()}
        </div>
        
        <div className="flex items-center gap-2">
          <button className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors">
            ⭐ Rate Fight
          </button>
          <button className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors">
            📺 Watch Highlights
          </button>
        </div>
      </div>

      {/* Spoiler Protection Notice */}
      {spoilerProtection && (
        <div className="mt-3 text-xs text-gray-500 italic">
          🙈 Spoiler protection enabled - results hidden until revealed
        </div>
      )}
    </div>
  )
}