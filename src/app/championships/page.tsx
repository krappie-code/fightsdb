import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export const revalidate = 60

const WEIGHT_CLASS_ORDER = [
  "Women's Strawweight",
  "Women's Flyweight",
  "Women's Bantamweight",
  "Women's Featherweight",
  'Strawweight',
  'Flyweight',
  'Bantamweight',
  'Featherweight',
  'Lightweight',
  'Welterweight',
  'Middleweight',
  'Light Heavyweight',
  'Heavyweight',
]

export default async function ChampionshipsPage() {
  // Get all title fights grouped by weight class
  const { data: titleFights } = await supabase
    .from('fights')
    .select('*, event:events(id,name,date), fighter1:fighters!fighter1_id(id,name,image_url), fighter2:fighters!fighter2_id(id,name,image_url)')
    .eq('title_fight', true)
    .order('created_at', { ascending: false })

  // Group by weight class
  const byDivision: Record<string, typeof titleFights> = {}
  for (const fight of titleFights ?? []) {
    const wc = fight.weight_class || 'Unknown'
    if (!byDivision[wc]) byDivision[wc] = []
    byDivision[wc]!.push(fight)
  }

  // Sort divisions by predefined order
  const sortedDivisions = Object.entries(byDivision).sort(([a], [b]) => {
    const ia = WEIGHT_CLASS_ORDER.indexOf(a)
    const ib = WEIGHT_CLASS_ORDER.indexOf(b)
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
  })

  const totalTitleFights = titleFights?.length ?? 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white">🥇 Championships</h1>
        <p className="text-zinc-400 mt-2">
          Title fight history across all UFC divisions • {totalTitleFights} title fights in database
        </p>
      </div>

      {sortedDivisions.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-lg">No title fights in database yet</p>
          <p className="text-sm mt-2">Title fight data will appear here as more events are scraped</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDivisions.map(([division, fights]) => (
            <DivisionSection key={division} division={division} fights={fights!} />
          ))}
        </div>
      )}
    </div>
  )
}

function DivisionSection({ division, fights }: { division: string; fights: any[] }) {
  // Sort by event date descending
  const sorted = [...fights].sort((a, b) => {
    const da = a.event?.date ? new Date(a.event.date).getTime() : 0
    const db = b.event?.date ? new Date(b.event.date).getTime() : 0
    return db - da
  })

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-bold text-yellow-400">{division}</h2>
        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
          {fights.length} title fight{fights.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="relative border-l-2 border-yellow-500/30 ml-4 space-y-0">
        {sorted.map((fight, i) => {
          const winner = fight.result === 'Win' ? fight.fighter1 : fight.result === 'Loss' ? fight.fighter2 : null
          const loser = fight.result === 'Win' ? fight.fighter2 : fight.result === 'Loss' ? fight.fighter1 : null
          const eventDate = fight.event?.date
            ? new Date(fight.event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
            : ''

          return (
            <div key={fight.id} className="relative pl-8 pb-6">
              {/* Timeline dot */}
              <div className="absolute left-[-7px] top-1.5 w-3 h-3 rounded-full bg-yellow-500 border-2 border-zinc-950" />

              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-yellow-500/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  {fight.event && (
                    <Link href={`/events/${fight.event.id}`} className="text-sm text-zinc-400 hover:text-yellow-400 transition-colors">
                      {fight.event.name}
                    </Link>
                  )}
                  <span className="text-xs text-zinc-600">{eventDate}</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Winner */}
                  {winner && (
                    <Link href={`/fighters/${winner.id}`} className="flex items-center gap-2 group">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border-2 border-yellow-500/50">
                        {winner.image_url ? (
                          <img src={winner.image_url} alt={winner.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm font-bold">
                            {winner.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-white font-bold group-hover:text-yellow-400 transition-colors text-sm">
                          {winner.name}
                        </span>
                        <span className="text-green-400 text-xs ml-2">🥇</span>
                      </div>
                    </Link>
                  )}

                  <span className="text-zinc-600 text-xs">def.</span>

                  {/* Loser */}
                  {loser && (
                    <Link href={`/fighters/${loser.id}`} className="text-zinc-400 hover:text-white transition-colors text-sm">
                      {loser.name}
                    </Link>
                  )}
                </div>

                {fight.method && (
                  <p className="text-zinc-600 text-xs mt-2">
                    {fight.method}{fight.method_detail ? ` (${fight.method_detail})` : ''} • R{fight.round} {fight.time}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
