// Batch seed script — scrapes UFC Stats events from a given year onwards
// Run with: npx tsx src/lib/scrapers/seed-batch.ts [--from-year 2020]

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

// Parse --from-year arg
const fromYearArg = process.argv.find(a => a.startsWith('--from-year'))
const fromYearIdx = process.argv.indexOf('--from-year')
const FROM_YEAR = fromYearIdx !== -1 ? parseInt(process.argv[fromYearIdx + 1]) : 2020

console.log(`📅 Will scrape events from ${FROM_YEAR} onwards\n`)

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

async function seedBatch() {
  console.log('🌱 Starting FightsDB batch seed...\n')

  // Get ALL events (no limit)
  const allEvents = await scraper.getRecentEvents(9999)
  
  // Filter by year
  const events = allEvents.filter(e => {
    try {
      const year = new Date(e.event_date).getFullYear()
      return year >= FROM_YEAR
    } catch {
      return false
    }
  })

  // Check which events we already have
  const { data: existingEvents } = await supabase
    .from('events')
    .select('ufc_stats_id')
  const existingIds = new Set((existingEvents ?? []).map(e => e.ufc_stats_id))

  const newEvents = events.filter(e => !existingIds.has(e.event_id))
  const skippedEvents = events.length - newEvents.length

  console.log(`📊 Found ${allEvents.length} total events on UFC Stats`)
  console.log(`📅 ${events.length} events from ${FROM_YEAR} onwards`)
  console.log(`⏭️  ${skippedEvents} already in database`)
  console.log(`🆕 ${newEvents.length} new events to scrape\n`)

  let totalFights = 0
  let totalNewFighters = 0
  let errors = 0

  for (let idx = 0; idx < newEvents.length; idx++) {
    const event = newEvents[idx]
    const progress = `[${idx + 1}/${newEvents.length}]`
    console.log(`${progress} 📍 ${event.event_name} (${event.event_date})`)

    // Upsert event
    const { data: eventRow, error: eventError } = await supabase
      .from('events')
      .upsert({
        ufc_stats_id: event.event_id,
        name: event.event_name,
        date: new Date(event.event_date).toISOString().split('T')[0],
        location: event.location,
        event_type: event.event_name.includes('Fight Night') ? 'UFC Fight Night' :
                    event.event_name.includes('Contender') ? "Dana White's Contender Series" :
                    event.event_name.includes('Ultimate Fighter') ? 'The Ultimate Fighter' : 'UFC',
      }, { onConflict: 'ufc_stats_id' })
      .select('id')
      .single()

    if (eventError) {
      console.error(`  ❌ Event error: ${eventError.message}`)
      errors++
      continue
    }

    // Scrape fights
    try {
      const fights = await scraper.getEventFights(event.event_id)
      console.log(`  🥊 ${fights.length} fights`)

      for (let i = 0; i < fights.length; i++) {
        const fight = fights[i]
        if (!fight.fighter_1 || !fight.fighter_2) continue

        const fighter1Id = await findOrCreateFighter(fight.fighter_1)
        const fighter2Id = await findOrCreateFighter(fight.fighter_2)

        const { method, method_detail } = parseMethod(fight.method)

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

        const titleFight = fight.title_fight
        const titleFightType = titleFight
          ? (fight.method.toLowerCase().includes('interim') ? 'interim' : 'undisputed')
          : null

        const { error: fightError } = await supabase
          .from('fights')
          .upsert({
            ufc_stats_id: fight.fight_id,
            event_id: eventRow!.id,
            fighter1_id: fighter1Id,
            fighter2_id: fighter2Id,
            weight_class: fight.weight_class || null,
            title_fight: titleFight,
            title_fight_type: titleFightType,
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
          errors++
        } else {
          totalFights++
        }
      }
    } catch (err) {
      console.error(`  ❌ Failed to scrape fights: ${err}`)
      errors++
    }

    // Progress every 10 events
    if ((idx + 1) % 10 === 0) {
      console.log(`\n⏳ Progress: ${idx + 1}/${newEvents.length} events, ${totalFights} fights so far\n`)
    }
  }

  console.log(`\n✅ Batch seed complete!`)
  console.log(`📊 ${newEvents.length} events processed, ${totalFights} fights added`)
  if (errors > 0) console.log(`⚠️  ${errors} errors encountered`)
}

seedBatch().catch(console.error)
