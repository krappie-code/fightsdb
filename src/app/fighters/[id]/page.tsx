import { supabase } from '@/lib/supabase'
import { FighterFightList } from './FighterFightList'

export const revalidate = 60

export default async function FighterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: fighter } = await supabase
    .from('fighters')
    .select('*')
    .eq('id', id)
    .single()

  if (!fighter) return <div className="text-center py-20 text-zinc-500">Fighter not found</div>

  const { data: fights } = await supabase
    .from('fights')
    .select('*, event:events(name,date), fighter1:fighters!fighter1_id(id,name), fighter2:fighters!fighter2_id(id,name)')
    .or(`fighter1_id.eq.${id},fighter2_id.eq.${id}`)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white">{fighter.name}</h1>
        {fighter.nickname && (
          <p className="text-zinc-500 text-lg italic mt-1">&ldquo;{fighter.nickname}&rdquo;</p>
        )}
        <div className="flex items-center gap-4 mt-3">
          <span className="text-2xl font-mono text-zinc-200">
            {fighter.wins}-{fighter.losses}-{fighter.draws}
          </span>
          <span className="text-zinc-500 bg-zinc-800 px-3 py-1 rounded text-sm">
            {fighter.weight_class}
          </span>
        </div>
        {fighter.height && <p className="text-zinc-500 text-sm mt-2">Height: {fighter.height}</p>}
        {fighter.reach && <p className="text-zinc-500 text-sm">Reach: {fighter.reach}&quot;</p>}
        {fighter.stance && <p className="text-zinc-500 text-sm">Stance: {fighter.stance}</p>}
      </div>

      <FighterFightList fights={fights ?? []} />
    </div>
  )
}
