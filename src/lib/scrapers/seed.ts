// Seed script — scrapes UFC Stats and inserts into Supabase
// Run with: npx tsx src/lib/scrapers/seed.ts

import { createClient } from '@supabase/supabase-js'
import { UFCStatsScraper } from './ufcstats'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
})

const scraper = new UFCStatsScraper()

async function findOrCreateFighter(name: string): Promise<string> {
  // Check if fighter exists
  const { data: existing } = await supabase
    .from('fighters')
    .select('id')
    .eq('name', name)
    .single()

  if (existing) return existing.id

  // Create new fighter
  const { data: created, error } = await supabase
    .from('fighters')
    .insert({ name })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create fighter ${name}: ${error.message}`)
  return created!.id
}

function parseMethod(method: string): { method: string; method_detail: string } {
  const normalized = method.trim().toUpperCase()
  if (normalized.includes('KO') || normalized.includes('TKO')) {
    return { method: 'KO/TKO', method_detail: method.trim() }
  }
  if (normalized.includes('SUB')) {
    return { method: 'Submission', method_detail: method.trim() }
  }
  if (normalized.includes('DEC') || normalized.includes('UNANIMOUS') || normalized.includes('SPLIT') || normalized.includes('MAJORITY')) {
    return { method: 'Decision', method_detail: method.trim() }
  }
  if (normalized.includes('DQ')) {
    return { method: 'DQ', method_detail: method.trim() }
  }
  return { method: 'No Contest', method_detail: method.trim() }
}

async function seed() {
  console.log('🌱 Starting FightsDB seed...\n')

  // Scrape recent events
  const events = await scraper.getRecentEvents(20)
  console.log(`\n📅 Processing ${events.length} events...\n`)

  let totalFights = 0
  let totalFighters = new Set<string>()

  for (const event of events) {
    console.log(`\n📍 ${event.event_name} (${event.event_date})`)

    // Upsert event
    const { data: eventRow, error: eventError } = await supabase
      .from('events')
      .upsert({
        ufc_stats_id: event.event_id,
        name: event.event_name,
        date: new Date(event.event_date).toISOString().split('T')[0],
        location: event.location,
        event_type: event.event_name.includes('Fight Night') ? 'UFC Fight Night' : 'UFC',
      }, { onConflict: 'ufc_stats_id' })
      .select('id')
      .single()

    if (eventError) {
      console.error(`  ❌ Event error: ${eventError.message}`)
      continue
    }

    // Scrape fights for this event
    try {
      const fights = await scraper.getEventFights(event.event_id)
      console.log(`  🥊 ${fights.length} fights`)

      for (let i = 0; i < fights.length; i++) {
        const fight = fights[i]

        if (!fight.fighter_1 || !fight.fighter_2) continue

        // Find or create fighters
        const fighter1Id = await findOrCreateFighter(fight.fighter_1)
        const fighter2Id = await findOrCreateFighter(fight.fighter_2)
        totalFighters.add(fight.fighter_1)
        totalFighters.add(fight.fighter_2)

        const { method, method_detail } = parseMethod(fight.method)

        // Determine winner
        const result = fight.result.trim().toUpperCase()
        let winnerId: string | null = null
        let fightResult: string = 'Win'
        if (result === 'W' || result === 'WIN') {
          winnerId = fighter1Id
          fightResult = 'Win'
        } else if (result === 'L' || result === 'LOSS') {
          winnerId = fighter2Id
          fightResult = 'Win'
        } else if (result === 'D' || result === 'DRAW') {
          fightResult = 'Draw'
        } else if (result === 'NC') {
          fightResult = 'No Contest'
        }

        const { error: fightError } = await supabase
          .from('fights')
          .upsert({
            ufc_stats_id: fight.fight_id,
            event_id: eventRow!.id,
            fighter1_id: fighter1Id,
            fighter2_id: fighter2Id,
            weight_class: fight.weight_class || null,
            title_fight: fight.title_fight,
            main_event: i === 0,
            card_position: fights.length - i,
            result: fightResult,
            winner_id: winnerId,
            method: method,
            method_detail: method_detail,
            round: parseInt(fight.round) || null,
            time: fight.time || null,
          }, { onConflict: 'ufc_stats_id' })

        if (fightError) {
          console.error(`  ❌ Fight error: ${fightError.message}`)
        } else {
          totalFights++
        }
      }
    } catch (err) {
      console.error(`  ❌ Failed to scrape fights: ${err}`)
    }
  }

  console.log(`\n✅ Seed complete!`)
  console.log(`📊 ${events.length} events, ${totalFights} fights, ${totalFighters.size} fighters`)
}

seed().catch(console.error)
