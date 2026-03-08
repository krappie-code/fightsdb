import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

interface Fighter { id?: string; name: string; ufc_stats_url?: string }
interface Fight {
  fighter1: string; fighter2: string; winner?: string;
  method?: string; method_detail?: string; round?: number; time?: string;
  weight_class?: string; title_fight?: boolean; bonus?: string[];
  fighter1_url?: string; fighter2_url?: string;
}

async function scrapeEventPage(url: string) {
  const res = await fetch(url)
  const html = await res.text()

  // Extract event name
  const nameMatch = html.match(/<span class="b-content__title-highlight">\s*([^<]+)/)
  const name = nameMatch?.[1]?.trim() || ''

  // Extract date
  const dateMatch = html.match(/Date:\s*<\/i>\s*([^<]+)/)
  const dateStr = dateMatch?.[1]?.trim() || ''
  const date = dateStr ? new Date(dateStr).toISOString().split('T')[0] : ''

  // Extract location
  const locMatch = html.match(/Location:\s*<\/i>\s*([^<]+)/)
  const location = locMatch?.[1]?.trim() || ''

  // Extract fights
  const fights: Fight[] = []
  // Fight rows pattern
  const fightPattern = /data-link="(http:\/\/ufcstats\.com\/fight-details\/[^"]+)"[\s\S]*?<td[^>]*>[\s\S]*?<p class="b-fight-details__table-text">\s*<a[^>]*href="([^"]*)"[^>]*>\s*([^<]+?)(?:\s*<\/a>)[\s\S]*?<p class="b-fight-details__table-text">\s*<a[^>]*href="([^"]*)"[^>]*>\s*([^<]+?)(?:\s*<\/a>)/g

  let match
  const rows = html.split('<tr class="b-fight-details__table-row')
  
  for (const row of rows) {
    if (!row.includes('fight-details')) continue
    
    // Extract fighter names and URLs
    const fighterLinks = [...row.matchAll(/<a[^>]*href="(http:\/\/ufcstats\.com\/fighter-details\/[^"]*)"[^>]*>\s*([^<]+?)\s*<\/a>/g)]
    if (fighterLinks.length < 2) continue

    const f1url = fighterLinks[0][1]
    const f1name = fighterLinks[0][2].trim()
    const f2url = fighterLinks[1][1]
    const f2name = fighterLinks[1][2].trim()

    // Check for win/loss indicators (nested inside b-flag__text)
    const flagMatch = row.match(/<i class="b-flag__text">(win|loss|draw|nc)/i)
    const flag = flagMatch?.[1]?.toLowerCase()
    let winner: string | undefined
    if (flag === 'win') winner = f1name

    // Weight class
    const wcMatch = row.match(/<p class="b-fight-details__table-text">\s*([\w\s']+weight|Catch Weight|Open Weight)\s*<\/p>/i)
    const weight_class = wcMatch?.[1]?.trim() || ''

    // Extract all <p> text content in order
    const pTexts = [...row.matchAll(/<p class="b-fight-details__table-text"[^>]*>([\s\S]*?)<\/p>/g)]
      .map(m => m[1].replace(/<[^>]+>/g, '').trim())
      .filter(t => t.length > 0)

    // Table order: fighter1, fighter2, KD1, KD2, STR1, STR2, TD1, TD2, SUB1, SUB2, weight_class, Method, Round, Time
    let method = '', method_detail = '', round = 0, time = ''

    // Find time (M:SS pattern) and round (digit before it)
    for (let i = 0; i < pTexts.length; i++) {
      if (pTexts[i].match(/^\d:\d{2}$/)) {
        time = pTexts[i]
        if (i > 0 && pTexts[i - 1].match(/^\d+$/)) {
          round = parseInt(pTexts[i - 1])
        }
        // Method detail is 2 before round
        if (i > 1) {
          method_detail = pTexts[i - 2]
        }
        break
      }
    }

    // Derive method from method_detail
    if (method_detail.startsWith('KO')) method = 'KO/TKO'
    else if (method_detail.startsWith('SUB')) method = 'Submission'
    else if (method_detail.includes('DEC')) method = 'Decision'
    else if (method_detail.startsWith('DQ')) method = 'DQ'
    else if (method_detail) method = method_detail

    // Title fight - check for belt image
    const titleFight = row.includes('belt.png')

    fights.push({
      fighter1: f1name, fighter2: f2name, winner,
      method, method_detail, weight_class, title_fight: titleFight,
      fighter1_url: f1url, fighter2_url: f2url,
    })
  }

  return { name, date, location, fights }
}

async function getOrCreateFighter(name: string, ufcStatsUrl?: string): Promise<string> {
  // Try to find existing
  const { data: existing } = await sb.from('fighters')
    .select('id')
    .eq('name', name)
    .limit(1)
    .single()
  
  if (existing) return existing.id

  // Create new
  const { data: created, error } = await sb.from('fighters')
    .insert({ name, ufc_stats_url: ufcStatsUrl })
    .select('id')
    .single()
  
  if (error) throw error
  console.log(`  👤 New fighter: ${name}`)
  return created!.id
}

async function main() {
  // New events to scrape
  const newEvents = [
    { url: 'http://ufcstats.com/event-details/15ec018d144710db', ufcStatsId: '15ec018d144710db' },
    // Only scrape completed events (Emmett vs Vallejos is March 14, still upcoming)
  ]

  for (const { url, ufcStatsId } of newEvents) {
    console.log(`\n🔍 Scraping ${url}...`)
    const event = await scrapeEventPage(url)
    console.log(`📅 ${event.name} — ${event.date} — ${event.location}`)
    console.log(`🥊 ${event.fights.length} fights found`)

    // Check if event exists
    const { data: existingEvent } = await sb.from('events')
      .select('id')
      .eq('ufc_stats_id', ufcStatsId)
      .single()

    let eventId: string
    if (existingEvent) {
      eventId = existingEvent.id
      console.log(`  ⏭️ Event already exists: ${eventId}`)
    } else {
      const { data: newEvent, error } = await sb.from('events')
        .insert({
          name: event.name,
          date: event.date,
          location: event.location,
          ufc_stats_id: ufcStatsId,
        })
        .select('id')
        .single()
      
      if (error) { console.error('Error creating event:', error); continue }
      eventId = newEvent!.id
      console.log(`  ✅ Created event: ${eventId}`)
    }

    // Insert fights
    for (let i = 0; i < event.fights.length; i++) {
      const fight = event.fights[i]
      
      const fighter1Id = await getOrCreateFighter(fight.fighter1, fight.fighter1_url)
      const fighter2Id = await getOrCreateFighter(fight.fighter2, fight.fighter2_url)

      let result = 'No Contest'
      if (fight.winner === fight.fighter1) result = 'Win'
      else if (fight.winner === fight.fighter2) result = 'Loss'
      else if (fight.winner) result = 'Win'

      // Check if fight already exists
      const { data: existingFight } = await sb.from('fights')
        .select('id')
        .eq('event_id', eventId)
        .eq('fighter1_id', fighter1Id)
        .eq('fighter2_id', fighter2Id)
        .single()

      if (existingFight) {
        console.log(`  ⏭️ Fight exists: ${fight.fighter1} vs ${fight.fighter2}`)
        continue
      }

      const { error: fightErr } = await sb.from('fights').insert({
        event_id: eventId,
        fighter1_id: fighter1Id,
        fighter2_id: fighter2Id,
        result,
        method: fight.method,
        method_detail: fight.method_detail,
        weight_class: fight.weight_class,
        title_fight: fight.title_fight || false,
        main_event: i === 0,
      })

      if (fightErr) console.error(`  ❌ ${fight.fighter1} vs ${fight.fighter2}:`, fightErr)
      else console.log(`  ✅ ${fight.fighter1} vs ${fight.fighter2} (${fight.weight_class}) — ${fight.method || 'TBD'}`)
    }
  }

  // Final count
  const { count } = await sb.from('events').select('*', { count: 'exact', head: true })
  const { count: fightCount } = await sb.from('fights').select('*', { count: 'exact', head: true })
  console.log(`\n📊 Total: ${count} events, ${fightCount} fights`)
}

main()
