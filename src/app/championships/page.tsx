import { supabase } from '@/lib/supabase'
import { ChampionshipsClient } from './ChampionshipsClient'

export const revalidate = 60

export default async function ChampionshipsPage() {
  // Get all title fights with related data
  const allFights: any[] = []
  let offset = 0
  while (true) {
    const { data } = await supabase
      .from('fights')
      .select('*, event:events!event_id(id,name,date,location), fighter1:fighters!fighter1_id(id,name,image_url), fighter2:fighters!fighter2_id(id,name,image_url)')
      .eq('title_fight', true)
      .range(offset, offset + 499)
    if (!data || data.length === 0) break
    allFights.push(...data)
    offset += data.length
    if (data.length < 500) break
  }

  return <ChampionshipsClient titleFights={allFights} />
}
