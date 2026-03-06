// Seed UFC 1 manually from Wikipedia data
// UFC Stats doesn't have UFC 1, so we add it ourselves
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

async function findOrCreateFighter(name: string): Promise<string> {
  const { data: existing } = await supabase
    .from('fighters')
    .select('id')
    .eq('name', name)
    .single()
  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from('fighters')
    .insert({ name })
    .select('id')
    .single()
  if (error) throw new Error(`Failed to create fighter ${name}: ${error.message}`)
  return created!.id
}

async function main() {
  console.log('🥊 Seeding UFC 1: The Beginning\n')

  // Create the event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .upsert({
      name: 'UFC 1: The Beginning',
      date: '1993-11-12',
      location: 'Denver, Colorado, USA',
      event_type: 'UFC',
      ufc_stats_id: 'ufc1-manual',
    }, { onConflict: 'ufc_stats_id' })
    .select('id')
    .single()

  if (eventError) {
    console.error('Event error:', eventError.message)
    return
  }
  console.log('✅ Event created:', event.id)

  // UFC 1 fights (card_position: higher = later on card)
  const fights = [
    // Quarter-finals
    {
      fighter1: 'Gerard Gordeau',
      fighter2: 'Teila Tuli',
      method: 'KO/TKO',
      method_detail: 'TKO (head kick)',
      round: 1,
      time: '0:26',
      weight_class: 'Open Weight',
      card_position: 1,
    },
    {
      fighter1: 'Kevin Rosier',
      fighter2: 'Zane Frazier',
      method: 'KO/TKO',
      method_detail: 'TKO (punches)',
      round: 1,
      time: '4:20',
      weight_class: 'Open Weight',
      card_position: 2,
    },
    {
      fighter1: 'Royce Gracie',
      fighter2: 'Art Jimmerson',
      method: 'Submission',
      method_detail: 'Submission (smother choke)',
      round: 1,
      time: '2:18',
      weight_class: 'Open Weight',
      card_position: 3,
    },
    {
      fighter1: 'Ken Shamrock',
      fighter2: 'Patrick Smith',
      method: 'Submission',
      method_detail: 'Submission (heel hook)',
      round: 1,
      time: '1:49',
      weight_class: 'Open Weight',
      card_position: 4,
    },
    // Semi-finals
    {
      fighter1: 'Gerard Gordeau',
      fighter2: 'Kevin Rosier',
      method: 'KO/TKO',
      method_detail: 'TKO (corner stoppage)',
      round: 1,
      time: '0:59',
      weight_class: 'Open Weight',
      card_position: 5,
    },
    {
      fighter1: 'Royce Gracie',
      fighter2: 'Ken Shamrock',
      method: 'Submission',
      method_detail: 'Submission (rear-naked choke)',
      round: 1,
      time: '0:57',
      weight_class: 'Open Weight',
      card_position: 6,
    },
    // Final
    {
      fighter1: 'Royce Gracie',
      fighter2: 'Gerard Gordeau',
      method: 'Submission',
      method_detail: 'Submission (rear-naked choke)',
      round: 1,
      time: '1:44',
      weight_class: 'Open Weight',
      card_position: 7,
      main_event: true,
    },
    // Alternate bout
    {
      fighter1: 'Jason DeLucia',
      fighter2: 'Trent Jenkins',
      method: 'Submission',
      method_detail: 'Submission (rear-naked choke)',
      round: 1,
      time: '0:52',
      weight_class: 'Open Weight',
      card_position: 0,
    },
  ]

  for (const fight of fights) {
    const f1id = await findOrCreateFighter(fight.fighter1)
    const f2id = await findOrCreateFighter(fight.fighter2)

    const { error } = await supabase.from('fights').insert({
      event_id: event.id,
      fighter1_id: f1id,
      fighter2_id: f2id,
      weight_class: fight.weight_class,
      method: fight.method,
      method_detail: fight.method_detail,
      round: fight.round,
      time: fight.time,
      card_position: fight.card_position,
      main_event: fight.main_event || false,
      title_fight: false,
      result: 'Win',
      winner_id: f1id,
      ufc_stats_id: `ufc1-${fight.card_position}`,
    })

    if (error) {
      console.error(`  ❌ ${fight.fighter1} vs ${fight.fighter2}: ${error.message}`)
    } else {
      console.log(`  ✅ ${fight.fighter1} def. ${fight.fighter2} — ${fight.method_detail} (${fight.time})`)
    }
  }

  console.log('\n🏆 UFC 1 seeded! Royce Gracie wins the tournament.')
}

main().catch(console.error)
