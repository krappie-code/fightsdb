import { supabase } from './supabase'

type RecordSnapshot = { w: number; l: number; d: number }

/**
 * For a list of fights (with event dates), compute each fighter's record
 * at the time of each fight (i.e. their record BEFORE that fight).
 * 
 * Returns a map of fightId → { f1: record, f2: record }
 */
export async function computeRecordsAtFight(
  fights: Array<{
    id: string
    fighter1_id: string
    fighter2_id: string
    result?: string
    event?: { date: string } | null
  }>
): Promise<Record<string, { f1: RecordSnapshot; f2: RecordSnapshot }>> {
  // Collect all unique fighter IDs
  const fighterIds = new Set<string>()
  for (const f of fights) {
    if (f.fighter1_id) fighterIds.add(f.fighter1_id)
    if (f.fighter2_id) fighterIds.add(f.fighter2_id)
  }

  if (fighterIds.size === 0) return {}

  // Fetch ALL fights for these fighters (to compute running records)
  const { data: allFights } = await supabase
    .from('fights')
    .select('id, fighter1_id, fighter2_id, result, event:events(date)')
    .or([...fighterIds].map(id => `fighter1_id.eq.${id},fighter2_id.eq.${id}`).join(','))
    .order('created_at', { ascending: true })

  if (!allFights) return {}

  // Sort by event date
  const sorted = [...allFights].sort((a, b) => {
    const dateA = (a.event as any)?.date ? new Date((a.event as any).date).getTime() : 0
    const dateB = (b.event as any)?.date ? new Date((b.event as any).date).getTime() : 0
    return dateA - dateB
  })

  // Walk through all fights chronologically, tracking each fighter's record
  const records: Record<string, RecordSnapshot> = {}
  const getOrInit = (fid: string): RecordSnapshot => {
    if (!records[fid]) records[fid] = { w: 0, l: 0, d: 0 }
    return records[fid]
  }

  const snapshots: Record<string, { f1: RecordSnapshot; f2: RecordSnapshot }> = {}

  for (const f of sorted) {
    const f1id = f.fighter1_id
    const f2id = f.fighter2_id
    if (!f1id || !f2id) continue

    const r1 = getOrInit(f1id)
    const r2 = getOrInit(f2id)

    // Snapshot before this fight
    snapshots[f.id] = { f1: { ...r1 }, f2: { ...r2 } }

    // Update after fight
    if (f.result === 'Win') { r1.w++; r2.l++ }
    else if (f.result === 'Loss') { r1.l++; r2.w++ }
    else if (f.result === 'Draw' || f.result === 'NC') { r1.d++; r2.d++ }
  }

  // Return only snapshots for the requested fights
  const result: Record<string, { f1: RecordSnapshot; f2: RecordSnapshot }> = {}
  for (const f of fights) {
    if (snapshots[f.id]) result[f.id] = snapshots[f.id]
  }
  return result
}
