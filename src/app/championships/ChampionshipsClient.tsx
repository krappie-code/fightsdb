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
      <div className="flex gap-1.5 mb-2 flex-wrap">
        {isInterim && (
          <span className="text-[10px] px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded font-bold uppercase">Interim Title</span>
        )}
        {showSpoilers && titleChanged && !isInterim && (
          <span className="text-[10px] px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded font-bold uppercase">👑 New Champion</span>
        )}
        {showSpoilers && defense && (
          <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded font-bold uppercase">🛡️ Title Defense</span>
        )}
        {showSpoilers && isDraw && (
          <span className="text-[10px] px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded font-bold uppercase">Draw — Champion Retains</span>
        )}
        {showSpoilers && isNC && (
          <span className="text-[10px] px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded font-bold uppercase">No Contest</span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        {fight.event && (
          <Link href={`/events/${fight.event.id}`} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors truncate">
            {fight.event.name}
          </Link>
        )}
        <span className="text-xs text-zinc-600 flex-shrink-0">{eventDate}</span>
      </div>
      {showSpoilers && fight.method && (
        <p className="text-zinc-600 text-xs mt-1">{fight.method} • R{fight.round} {fight.time}</p>
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
        items.push({ type: 'vacancy', previousChamp: currentChamp, previousChampId: currentChampId, date: fight.event?.date })
      }

      items.push({
        type: 'fight', fight, winner, loser, isInterim, isDraw, isNC, titleChanged,
        newChamp: newChamp ? winner?.name : null, defense: newChamp && !titleChanged,
      })

      if (newChamp && !isInterim) { currentChamp = winner.name; currentChampId = winner.id }
    }
    return items
  }

  // Group timeline into sections: main runs and interim branches
  const buildSections = (timeline: any[]) => {
    const sections: any[] = []
    let i = 0
    while (i < timeline.length) {
      if (timeline[i].type === 'fight' && timeline[i].isInterim) {
        const interimItems: any[] = []
        while (i < timeline.length && timeline[i].type === 'fight' && timeline[i].isInterim) {
          interimItems.push(timeline[i])
          i++
        }
        sections.push({ kind: 'interim-branch', items: interimItems })
      } else {
        sections.push({ kind: 'main', item: timeline[i] })
        i++
      }
    }
    return sections
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
            <p className="text-zinc-400 mt-1">Championship history across all UFC divisions • {titleFights.length} title fights</p>
          </div>
          <SpoilerToggle revealed={showSpoilers} onToggle={() => setShowSpoilers(!showSpoilers)} label={showSpoilers ? '🙈 Hide Results' : '👁️ Show Results'} />
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
              <button key={opt.value} onClick={() => { setGenderFilter(opt.value); setSelectedDivision('') }}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${genderFilter === opt.value ? 'bg-yellow-500/20 text-yellow-400 font-semibold' : 'text-zinc-400 hover:text-white'}`}
              >{opt.label}</button>
            ))}
          </div>
          <select value={selectedDivision} onChange={(e) => setSelectedDivision(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors">
            <option value="">All Divisions</option>
            {DIVISIONS.filter(d => !genderFilter || d.gender === genderFilter).filter(d => byDivision[d.key]).map(d => (
              <option key={d.key} value={d.key}>{d.label} ({byDivision[d.key]?.length ?? 0})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-12">
        {visibleDivisions.map(div => {
          const fights = byDivision[div.key] || []
          const timeline = buildTimeline(fights)
          const sections = buildSections(timeline)
          // Reverse for display (most recent first)
          const displaySections = [...sections].reverse()
          const lastWin = [...timeline].reverse().find(t => t.type === 'fight' && t.winner && !t.isInterim && !t.isDraw && !t.isNC)

          return (
            <div key={div.key} id={div.key.replace(/\s+/g, '-').toLowerCase()}>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-yellow-400">{div.label}</h2>
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{fights.length} title fight{fights.length !== 1 ? 's' : ''}</span>
              </div>

              {lastWin && showSpoilers && (
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm text-zinc-500">Current champion:</span>
                  <Link href={`/fighters/${lastWin.winner.id}`} className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden border-2 border-yellow-500">
                      {lastWin.winner.image_url ? (
                        <img src={lastWin.winner.image_url} alt={lastWin.winner.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-bold">{lastWin.winner.name.charAt(0)}</div>
                      )}
                    </div>
                    <span className="text-yellow-400 font-bold group-hover:text-yellow-300 transition-colors">{lastWin.winner.name}</span>
                  </Link>
                </div>
              )}

              {/* Timeline */}
              {displaySections.map((section, sIdx) => {

                /* ── Interim branch: two parallel lines via nested borders ── */
                if (section.kind === 'interim-branch') {
                  const items = [...section.items].reverse()
                  // Line positions: main at x=0 (border), branch at x=40
                  const BRANCH_GAP = 40
                  const CURVE_H = 48
                  return (
                    <div key={`branch-${sIdx}`} className="ml-[13px]">
                      {/* ── Merge: branch curves back into main ── */}
                      <div className="relative" style={{ height: CURVE_H, marginLeft: 0 }}>
                        {/* Main line (solid) */}
                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-yellow-500/20" />
                        {/* SVG curve: from branch position (right, top) to main position (left, bottom) */}
                        <svg
                          className="absolute left-0 top-0 block"
                          width={BRANCH_GAP + 2}
                          height={CURVE_H}
                          viewBox={`0 0 ${BRANCH_GAP + 2} ${CURVE_H}`}
                          style={{ overflow: 'visible' }}
                        >
                          <path
                            d={`M ${BRANCH_GAP} 0 C ${BRANCH_GAP} ${CURVE_H * 0.6}, 1 ${CURVE_H * 0.4}, 1 ${CURVE_H}`}
                            stroke="rgb(251 146 60)"
                            strokeWidth="2.5"
                            fill="none"
                            opacity="0.6"
                          />
                          {/* Dot at top of curve (branch end) */}
                          <circle cx={BRANCH_GAP} cy="0" r="5" fill="rgb(251 146 60)" stroke="rgb(9 9 11)" strokeWidth="2" />
                          {/* Dot at bottom of curve (merge into main) */}
                          <circle cx="1" cy={CURVE_H} r="5" fill="rgb(234 179 8)" stroke="rgb(9 9 11)" strokeWidth="2" />
                        </svg>
                        {/* Label */}
                        <div className="absolute flex items-center" style={{ left: BRANCH_GAP + 16, top: 8 }}>
                          <span className="text-[11px] text-zinc-500 italic whitespace-nowrap">titles unified</span>
                        </div>
                      </div>

                      {/* ── Interim fights: two parallel lines ── */}
                      {items.map((item: any) => (
                        <div key={item.fight.id} className="relative pb-4" style={{ paddingLeft: BRANCH_GAP + 20 }}>
                          {/* Main line (dashed — champ inactive) */}
                          <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{
                            backgroundImage: 'repeating-linear-gradient(to bottom, rgb(234 179 8 / 0.15) 0px, rgb(234 179 8 / 0.15) 4px, transparent 4px, transparent 8px)',
                          }} />
                          {/* Branch line (solid orange) */}
                          <div className="absolute top-0 bottom-0 w-[2px] bg-orange-500/50" style={{ left: BRANCH_GAP }} />
                          {/* Dot on branch line */}
                          <div className="absolute w-3 h-3 rounded-full bg-orange-400 border-2 border-zinc-950" style={{ left: BRANCH_GAP - 5, top: 16 }} />
                          <div className="pt-1">
                            <FightCard item={item} showSpoilers={showSpoilers} />
                          </div>
                        </div>
                      ))}

                      {/* ── Fork: main line splits out to branch ── */}
                      <div className="relative" style={{ height: CURVE_H, marginLeft: 0 }}>
                        {/* Main line (solid) */}
                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-yellow-500/20" />
                        {/* SVG curve: from main position (left, top) to branch position (right, bottom) */}
                        <svg
                          className="absolute left-0 top-0 block"
                          width={BRANCH_GAP + 2}
                          height={CURVE_H}
                          viewBox={`0 0 ${BRANCH_GAP + 2} ${CURVE_H}`}
                          style={{ overflow: 'visible' }}
                        >
                          <path
                            d={`M 1 0 C 1 ${CURVE_H * 0.6}, ${BRANCH_GAP} ${CURVE_H * 0.4}, ${BRANCH_GAP} ${CURVE_H}`}
                            stroke="rgb(251 146 60)"
                            strokeWidth="2.5"
                            fill="none"
                            opacity="0.6"
                          />
                          {/* Dot at top of curve (fork from main) */}
                          <circle cx="1" cy="0" r="5" fill="rgb(234 179 8)" stroke="rgb(9 9 11)" strokeWidth="2" />
                          {/* Dot at bottom of curve (branch start) */}
                          <circle cx={BRANCH_GAP} cy={CURVE_H} r="5" fill="rgb(251 146 60)" stroke="rgb(9 9 11)" strokeWidth="2" />
                        </svg>
                        {/* Label */}
                        <div className="absolute flex items-center" style={{ left: BRANCH_GAP + 16, top: CURVE_H - 20 }}>
                          <span className="text-[11px] text-orange-400/70 italic whitespace-nowrap">interim title created</span>
                        </div>
                      </div>
                    </div>
                  )
                }

                /* ── Main lane item ── */
                if (section.kind === 'main') {
                  const item = section.item

                  if (item.type === 'vacancy') {
                    return (
                      <div key={`vacancy-${sIdx}`} className="relative pl-8 py-3 ml-[13px] border-l-2 border-yellow-500/20">
                        <div className="absolute left-[-8px] top-[18px] w-3.5 h-3.5 rounded-full bg-zinc-900 border-2 border-red-500/50" />
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
                    <div key={item.fight.id} className="relative pl-8 pb-4 ml-[13px] border-l-2 border-yellow-500/20">
                      <div className={`absolute -left-[7px] top-[16px] w-3 h-3 rounded-full border-2 border-zinc-950 ${
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
          )
        })}
      </div>
    </div>
  )
}
