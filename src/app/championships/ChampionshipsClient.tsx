'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { SpoilerToggle } from '@/components/SpoilerToggle'

const DIVISIONS = [
  { key: 'Heavyweight', label: 'Heavyweight', gender: 'men' },
  { key: 'Light Heavyweight', label: 'Light Heavyweight', gender: 'men' },
  { key: 'Middleweight', label: 'Middleweight', gender: 'men' },
  { key: 'Welterweight', label: 'Welterweight', gender: 'men' },
  { key: 'Lightweight', label: 'Lightweight', gender: 'men' },
  { key: 'Featherweight', label: 'Featherweight', gender: 'men' },
  { key: 'Bantamweight', label: 'Bantamweight', gender: 'men' },
  { key: 'Flyweight', label: 'Flyweight', gender: 'men' },
  { key: "Women's Bantamweight", label: "Women's Bantamweight", gender: 'women' },
  { key: "Women's Flyweight", label: "Women's Flyweight", gender: 'women' },
  { key: "Women's Strawweight", label: "Women's Strawweight", gender: 'women' },
  { key: "Women's Featherweight", label: "Women's Featherweight", gender: 'women' },
  { key: 'BMF', label: 'BMF (Baddest Motherf***er)', gender: 'special' },
  { key: 'Open Weight', label: 'Open Weight (Legacy)', gender: 'legacy' },
]

interface ChampionshipsClientProps {
  titleFights: any[]
}

/* ── Fight card ── */
function FightCard({ item, showSpoilers }: { item: any; showSpoilers: boolean }) {
  const { fight, winner, isInterim, isDraw, isNC, titleChanged, defense } = item
  const eventDate = fight.event?.date
    ? new Date(fight.event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : ''

  return (
    <div className={`bg-zinc-900 border rounded-lg p-3 sm:p-4 transition-colors ${
      isInterim ? 'border-orange-500/30 hover:border-orange-500/50' :
      titleChanged ? 'border-yellow-500/20 hover:border-yellow-500/40' :
      'border-zinc-800 hover:border-zinc-700'
    }`}>
      {/* Fighters */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <Link href={`/fighters/${fight.fighter1?.id}`} className="flex items-center gap-1.5 group min-w-0">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-800 overflow-hidden border-2 flex-shrink-0 ${
            showSpoilers && winner?.id === fight.fighter1?.id
              ? (isInterim ? 'border-orange-500' : 'border-yellow-500')
              : 'border-zinc-700'
          }`}>
            {fight.fighter1?.image_url ? (
              <img src={fight.fighter1.image_url} alt={fight.fighter1.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-bold">
                {fight.fighter1?.name?.charAt(0)}
              </div>
            )}
          </div>
          <span className={`font-bold group-hover:text-yellow-400 transition-colors text-xs sm:text-sm truncate ${
            showSpoilers && winner?.id === fight.fighter1?.id ? 'text-white' : 'text-zinc-300'
          }`}>
            {fight.fighter1?.name}
            {showSpoilers && winner?.id === fight.fighter1?.id && ' 🏆'}
          </span>
        </Link>

        <span className="text-zinc-600 font-bold text-[10px] flex-shrink-0">VS</span>

        <Link href={`/fighters/${fight.fighter2?.id}`} className="flex items-center gap-1.5 group min-w-0">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-800 overflow-hidden border-2 flex-shrink-0 ${
            showSpoilers && winner?.id === fight.fighter2?.id
              ? (isInterim ? 'border-orange-500' : 'border-yellow-500')
              : 'border-zinc-700'
          }`}>
            {fight.fighter2?.image_url ? (
              <img src={fight.fighter2.image_url} alt={fight.fighter2.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-bold">
                {fight.fighter2?.name?.charAt(0)}
              </div>
            )}
          </div>
          <span className={`font-bold group-hover:text-yellow-400 transition-colors text-xs sm:text-sm truncate ${
            showSpoilers && winner?.id === fight.fighter2?.id ? 'text-white' : 'text-zinc-300'
          }`}>
            {fight.fighter2?.name}
            {showSpoilers && winner?.id === fight.fighter2?.id && ' 🏆'}
          </span>
        </Link>
      </div>

      {/* Tags */}
      <div className="flex gap-1.5 mb-2 flex-wrap">
        {isInterim && (
          <span className="text-[10px] px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded font-bold uppercase">
            Interim Title
          </span>
        )}
        {showSpoilers && titleChanged && !isInterim && (
          <span className="text-[10px] px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded font-bold uppercase">
            👑 New Champion
          </span>
        )}
        {showSpoilers && defense && (
          <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded font-bold uppercase">
            🛡️ Title Defense
          </span>
        )}
        {showSpoilers && isDraw && (
          <span className="text-[10px] px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded font-bold uppercase">
            Draw — Champion Retains
          </span>
        )}
        {showSpoilers && isNC && (
          <span className="text-[10px] px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded font-bold uppercase">
            No Contest
          </span>
        )}
      </div>

      {/* Event + date */}
      <div className="flex items-center justify-between gap-2">
        {fight.event && (
          <Link href={`/events/${fight.event.id}`} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors truncate">
            {fight.event.name}
          </Link>
        )}
        <span className="text-xs text-zinc-600 flex-shrink-0">{eventDate}</span>
      </div>

      {showSpoilers && fight.method && (
        <p className="text-zinc-600 text-xs mt-1">
          {fight.method} • R{fight.round} {fight.time}
        </p>
      )}
    </div>
  )
}

export function ChampionshipsClient({ titleFights }: ChampionshipsClientProps) {
  const [selectedDivision, setSelectedDivision] = useState('')
  const [showSpoilers, setShowSpoilers] = useState(false)
  const [genderFilter, setGenderFilter] = useState<string>('')

  const byDivision = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    for (const fight of titleFights) {
      if (fight.title_fight_type === 'bmf') {
        if (!grouped['BMF']) grouped['BMF'] = []
        grouped['BMF'].push(fight)
        continue
      }
      const wc = fight.weight_class || 'Unknown'
      if (!grouped[wc]) grouped[wc] = []
      grouped[wc].push(fight)
    }
    for (const wc of Object.keys(grouped)) {
      grouped[wc].sort((a: any, b: any) => {
        const da = a.event?.date ? new Date(a.event.date).getTime() : 0
        const db = b.event?.date ? new Date(b.event.date).getTime() : 0
        return da - db
      })
    }
    return grouped
  }, [titleFights])

  const buildTimeline = (fights: any[]) => {
    const items: any[] = []
    let currentChamp: string | null = null
    let currentChampId: string | null = null

    for (const fight of fights) {
      const winner = fight.result === 'Win' ? fight.fighter1 :
                     fight.result === 'Loss' ? fight.fighter2 : null
      const loser = fight.result === 'Win' ? fight.fighter2 :
                    fight.result === 'Loss' ? fight.fighter1 : null
      const isInterim = fight.title_fight_type === 'interim'
      const isDraw = fight.result === 'Draw'
      const isNC = fight.result === 'No Contest'
      const newChamp = winner && !isDraw && !isNC
      const titleChanged = newChamp && winner.id !== currentChampId

      if (newChamp && currentChampId && titleChanged && loser?.id !== currentChampId && !isInterim) {
        items.push({
          type: 'vacancy',
          previousChamp: currentChamp,
          previousChampId: currentChampId,
          date: fight.event?.date,
        })
      }

      items.push({
        type: 'fight',
        fight,
        winner,
        loser,
        isInterim,
        isDraw,
        isNC,
        titleChanged,
        newChamp: newChamp ? winner?.name : null,
        defense: newChamp && !titleChanged,
      })

      if (newChamp && !isInterim) {
        currentChamp = winner.name
        currentChampId = winner.id
      }
    }
    return items
  }

  /*
   * Build display rows with branch awareness.
   * Walk chronologically, detect interim "clusters" and wrap them
   * in fork/merge markers.
   */
  const buildDisplayRows = (timeline: any[]) => {
    const rows: any[] = []
    let i = 0

    while (i < timeline.length) {
      const item = timeline[i]

      if (item.type === 'fight' && item.isInterim) {
        // Collect consecutive interim fights
        rows.push({ kind: 'fork' })
        while (i < timeline.length && timeline[i].type === 'fight' && timeline[i].isInterim) {
          rows.push({ kind: 'interim', item: timeline[i] })
          i++
        }
        rows.push({ kind: 'merge' })
      } else {
        rows.push({ kind: 'main', item })
        i++
      }
    }
    return rows
  }

  const visibleDivisions = DIVISIONS.filter(d => {
    if (selectedDivision && d.key !== selectedDivision) return false
    if (genderFilter && d.gender !== genderFilter) return false
    return byDivision[d.key] && byDivision[d.key].length > 0
  })

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-black text-white">🏆 Titles</h1>
            <p className="text-zinc-400 mt-1">
              Championship history across all UFC divisions • {titleFights.length} title fights
            </p>
          </div>
          <SpoilerToggle
            revealed={showSpoilers}
            onToggle={() => setShowSpoilers(!showSpoilers)}
            label={showSpoilers ? '🙈 Hide Results' : '👁️ Show Results'}
          />
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
            {[
              { value: '', label: 'All' },
              { value: 'men', label: "Men's" },
              { value: 'women', label: "Women's" },
              { value: 'special', label: 'Special' },
              { value: 'legacy', label: 'Legacy' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => { setGenderFilter(opt.value); setSelectedDivision('') }}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  genderFilter === opt.value
                    ? 'bg-yellow-500/20 text-yellow-400 font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >{opt.label}</button>
            ))}
          </div>

          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors"
          >
            <option value="">All Divisions</option>
            {DIVISIONS.filter(d => !genderFilter || d.gender === genderFilter)
              .filter(d => byDivision[d.key])
              .map(d => (
                <option key={d.key} value={d.key}>
                  {d.label} ({byDivision[d.key]?.length ?? 0})
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="space-y-12">
        {visibleDivisions.map(div => {
          const fights = byDivision[div.key] || []
          const timeline = buildTimeline(fights)
          const displayRows = [...buildDisplayRows(timeline)].reverse()

          const lastWin = [...timeline].reverse().find(t => t.type === 'fight' && t.winner && !t.isInterim && !t.isDraw && !t.isNC)

          return (
            <div key={div.key} id={div.key.replace(/\s+/g, '-').toLowerCase()}>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-yellow-400">{div.label}</h2>
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                  {fights.length} title fight{fights.length !== 1 ? 's' : ''}
                </span>
              </div>

              {lastWin && showSpoilers && (
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm text-zinc-500">Current champion:</span>
                  <Link href={`/fighters/${lastWin.winner.id}`} className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden border-2 border-yellow-500">
                      {lastWin.winner.image_url ? (
                        <img src={lastWin.winner.image_url} alt={lastWin.winner.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-bold">
                          {lastWin.winner.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="text-yellow-400 font-bold group-hover:text-yellow-300 transition-colors">
                      {lastWin.winner.name}
                    </span>
                  </Link>
                </div>
              )}

              {/* Timeline */}
              <div className="relative ml-4">
                {displayRows.map((row, idx) => {

                  /* ── Fork label (shown as merge when reversed) ── */
                  if (row.kind === 'merge') {
                    return (
                      <div key={`merge-${idx}`} className="relative py-2 pl-8">
                        {/* Main line */}
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-yellow-500/20" />
                        {/* Merge dot on main line */}
                        <div className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-yellow-500" />
                        {/* Curved connector from interim lane back to main */}
                        <div className="absolute left-[5px] top-1/2 -translate-y-1/2">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-orange-500/50">
                            <path d="M0 12 Q12 12 24 0" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
                          </svg>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-xs text-zinc-500 italic">↙ Titles unified</span>
                        </div>
                      </div>
                    )
                  }

                  /* ── Interim fight (indented right with its own orange line) ── */
                  if (row.kind === 'interim') {
                    const item = row.item
                    return (
                      <div key={item.fight.id} className="relative pb-4">
                        {/* Main line continues faded on the left */}
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-yellow-500/10" style={{ borderLeft: '2px dashed rgba(234,179,8,0.15)' }} />
                        {/* Interim lane — shifted right */}
                        <div className="ml-8 sm:ml-12 relative pl-6 border-l-2 border-orange-500/40">
                          <div className="absolute left-[-6px] top-3 w-3 h-3 rounded-full bg-orange-400 border-2 border-zinc-950" />
                          <FightCard item={item} showSpoilers={showSpoilers} />
                        </div>
                      </div>
                    )
                  }

                  /* ── Merge label (shown as fork when reversed) ── */
                  if (row.kind === 'fork') {
                    return (
                      <div key={`fork-${idx}`} className="relative py-2 pl-8">
                        {/* Main line */}
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-yellow-500/20" />
                        {/* Fork dot */}
                        <div className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-orange-400" />
                        {/* Curved connector from main line out to interim lane */}
                        <div className="absolute left-[5px] top-1/2 -translate-y-1/2">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-orange-500/50">
                            <path d="M0 12 Q12 12 24 24" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
                          </svg>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-xs text-orange-400/70 italic">↗ Interim title created</span>
                        </div>
                      </div>
                    )
                  }

                  /* ── Main lane fight ── */
                  if (row.kind === 'main') {
                    const item = row.item

                    if (item.type === 'vacancy') {
                      return (
                        <div key={`vacancy-${idx}`} className="relative pl-8 py-3">
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-yellow-500/20" />
                          <div className="absolute left-[-7px] top-4 w-3.5 h-3.5 rounded-full bg-zinc-800 border-2 border-red-500/50 flex items-center justify-center">
                            <span className="text-[7px]">⚡</span>
                          </div>
                          <div className="bg-red-500/5 border border-red-500/20 border-dashed rounded-lg px-4 py-2">
                            <p className="text-red-400/80 text-sm">
                              🏚️ Title vacated
                              {showSpoilers && item.previousChamp && (
                                <span className="text-zinc-500 ml-1">— {item.previousChamp} did not defend</span>
                              )}
                            </p>
                          </div>
                        </div>
                      )
                    }

                    const { titleChanged, defense, isDraw, isNC } = item
                    return (
                      <div key={item.fight.id} className="relative pl-8 pb-4">
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-yellow-500/20" />
                        <div className={`absolute left-[-5px] top-3 w-3 h-3 rounded-full border-2 border-zinc-950 ${
                          titleChanged ? 'bg-yellow-500' :
                          defense ? 'bg-green-500' :
                          isDraw || isNC ? 'bg-zinc-500' :
                          'bg-yellow-500'
                        }`} />
                        <FightCard item={item} showSpoilers={showSpoilers} />
                      </div>
                    )
                  }

                  return null
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
