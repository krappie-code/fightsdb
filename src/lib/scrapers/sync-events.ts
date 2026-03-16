/**
 * UFC Event Sync Script
 * 
 * Syncs both upcoming and completed events from UFC Stats.
 * - Scrapes upcoming events page for new/updated fight cards
 * - Scrapes completed events page for newly completed events
 * - Updates upcoming events to completed when results come in
 * - Fetches Wikipedia posters for newly completed events
 * 
 * Run manually: npx tsx src/lib/scrapers/sync-events.ts
 * Or via cron / Next.js API route
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// ─── Scraping helpers ───

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

interface ScrapedEvent {
  name: string
  date: string
  location?: string
  ufcStatsId: string
  url: string
}

interface ScrapedFight {
  fighter1: string
  fighter2: string
  fighter1_url?: string
  fighter2_url?: string
  winner?: string
  method?: string
  method_detail?: string
  round?: number
  time?: string
  weight_class?: string
  title_fight?: boolean
}

/** Scrape event list from UFC Stats (upcoming or completed) */
async function scrapeEventList(type: 'upcoming' | 'completed', limit = 5): Promise<ScrapedEvent[]> {
  const html = await fetchHtml(`http://ufcstats.com/statistics/events/${type}`)
  const events: ScrapedEvent[] = []

  const eventLinks = [...html.matchAll(/<a href="(http:\/\/ufcstats\.com\/event-details\/([^"]+))"[^>]*>([\s\S]*?)<\/a>/g)]
  const dates = [...html.matchAll(/<span class="b-statistics__date">\s*([^<]+)/g)]

  for (let i = 0; i < Math.min(eventLinks.length, limit); i++) {
    const url = eventLinks[i][1]
    const ufcStatsId = eventLinks[i][2]
    const name = eventLinks[i][3].replace(/<[^>]+>/g, '').trim()
    const dateStr = dates[i]?.[1]?.trim() || ''
    const date = dateStr ? new Date(dateStr).toISOString().split('T')[0] : ''

    if (name) events.push({ name, date, url, ufcStatsId })
  }

  return events
}

/** Scrape fight card from an event detail page */
async function scrapeEventFights(url: string): Promise<{ fights: ScrapedFight[], location: string, name: string, date: string }> {
  const html = await fetchHtml(url)

  const nameMatch = html.match(/<span class="b-content__title-highlight">\s*([^<]+)/)
  const name = nameMatch?.[1]?.trim() || ''

  const dateMatch = html.match(/Date:\s*<\/i>\s*([^<]+)/)
  const dateStr = dateMatch?.[1]?.trim() || ''
  const date = dateStr ? new Date(dateStr).toISOString().split('T')[0] : ''

  const locMatch = html.match(/Location:\s*<\/i>\s*([^<]+)/)
  const location = locMatch?.[1]?.trim() || ''

  const fights: ScrapedFight[] = []
  const rows = html.split('<tr class="b-fight-details__table-row')

  for (const row of rows) {
    if (!row.includes('fight-details')) continue

    const fighterLinks = [...row.matchAll(/<a[^>]*href="(http:\/\/ufcstats\.com\/fighter-details\/[^"]*)"[^>]*>\s*([^<]+?)\s*<\/a>/g)]
    if (fighterLinks.length < 2) continue

    const f1url = fighterLinks[0][1]
    const f1name = fighterLinks[0][2].trim()
    const f2url = fighterLinks[1][1]
    const f2name = fighterLinks[1][2].trim()

    // Winner detection
    const flagMatch = row.match(/<i class="b-flag__text">(win|loss|draw|nc)/i)
    const flag = flagMatch?.[1]?.toLowerCase()
    let winner: string | undefined
    if (flag === 'win') winner = f1name

    // Weight class - match text followed by <br> (not </p>)
    const wcMatch = row.match(/((?:Women'?s\s+)?(?:Light\s+)?(?:Heavy|Middle|Welter|Feather|Bantam|Fly|Super\s+Heavy|Open|Catch)\s*weight|Lightweight)\s*<br/i)
    const weight_class = wcMatch?.[1]?.trim() || ''

    // Extract all <p> text for method/round/time
    const pTexts = [...row.matchAll(/<p class="b-fight-details__table-text"[^>]*>([\s\S]*?)<\/p>/g)]
      .map(m => m[1].replace(/<[^>]+>/g, '').trim())
      .filter(t => t.length > 0)

    let method = '', method_detail = '', round = 0, time = ''
    for (let i = 0; i < pTexts.length; i++) {
      if (pTexts[i].match(/^\d:\d{2}$/)) {
        time = pTexts[i]
        if (i > 0 && pTexts[i - 1].match(/^\d+$/)) round = parseInt(pTexts[i - 1])
        if (i > 1) method_detail = pTexts[i - 2]
        break
      }
    }

    // UFC Stats sometimes shows specific techniques instead of KO/TKO or SUB
    const subTechniques = /choke|armbar|triangle|kimura|americana|heel hook|kneebar|lock|crank|slicer|twister/i
    const koTechniques = /punch|kick|knee|elbow|slam|strikes|stomp|soccer/i
    if (method_detail.startsWith('KO')) method = 'KO/TKO'
    else if (method_detail.startsWith('SUB')) method = 'Submission'
    else if (method_detail.includes('DEC')) method = 'Decision'
    else if (method_detail.startsWith('DQ')) method = 'DQ'
    else if (subTechniques.test(method_detail)) method = 'Submission'
    else if (koTechniques.test(method_detail)) method = 'KO/TKO'
    else if (method_detail) method = 'KO/TKO'

    const titleFight = row.includes('belt.png')

    fights.push({
      fighter1: f1name, fighter2: f2name, winner,
      method, method_detail, round, time, weight_class,
      title_fight: titleFight,
      fighter1_url: f1url, fighter2_url: f2url,
    })
  }

  return { fights, location, name, date }
}

/** Get Wikipedia poster URL for an event */
async function getWikipediaPoster(eventName: string): Promise<string | null> {
  try {
    // Try "UFC_XXX" format for numbered events, or full name
    const wikiTitle = eventName.replace(/\s+/g, '_').replace(/:/g, '')
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=images&format=json`
    const res = await fetch(apiUrl)
    const data = await res.json()

    const pages = data?.query?.pages || {}
    const page = Object.values(pages)[0] as any
    if (!page?.images) return null

    const posterFile = page.images.find((img: any) =>
      img.title.toLowerCase().includes('poster') && img.title.match(/\.(jpg|jpeg|png)$/i)
    )
    if (!posterFile) return null

    const infoUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(posterFile.title)}&prop=imageinfo&iiprop=url&format=json`
    const infoRes = await fetch(infoUrl)
    const infoData = await infoRes.json()

    const infoPages = infoData?.query?.pages || {}
    const infoPage = Object.values(infoPages)[0] as any
    return infoPage?.imageinfo?.[0]?.url || null
  } catch {
    return null
  }
}

// ─── DB helpers ───

async function getOrCreateFighter(name: string, ufcStatsUrl?: string): Promise<string> {
  const { data: existing } = await sb.from('fighters')
    .select('id')
    .eq('name', name)
    .limit(1)
    .single()

  if (existing) return existing.id

  const { data: created, error } = await sb.from('fighters')
    .insert({ name, ufc_stats_url: ufcStatsUrl })
    .select('id')
    .single()

  if (error) throw error
  console.log(`  👤 New fighter: ${name}`)
  return created!.id
}

async function upsertEvent(event: ScrapedEvent, status: 'upcoming' | 'completed'): Promise<string> {
  const { data: existing } = await sb.from('events')
    .select('id, status')
    .eq('ufc_stats_id', event.ufcStatsId)
    .single()

  if (existing) {
    // Update status if changed
    if (existing.status !== status) {
      await sb.from('events').update({ status, name: event.name, location: event.location || undefined }).eq('id', existing.id)
      console.log(`  📝 Updated ${event.name} → ${status}`)
    }
    return existing.id
  }

  const { data: created, error } = await sb.from('events')
    .insert({
      name: event.name,
      date: event.date,
      location: event.location || null,
      ufc_stats_id: event.ufcStatsId,
      status,
    })
    .select('id')
    .single()

  if (error) throw error
  console.log(`  ✅ Created ${status} event: ${event.name}`)
  return created!.id
}

async function upsertFights(eventId: string, fights: ScrapedFight[], isCompleted: boolean) {
  for (let i = 0; i < fights.length; i++) {
    const fight = fights[i]

    const fighter1Id = await getOrCreateFighter(fight.fighter1, fight.fighter1_url)
    const fighter2Id = await getOrCreateFighter(fight.fighter2, fight.fighter2_url)

    // Check if fight exists
    const { data: existing } = await sb.from('fights')
      .select('id, result, winner_id')
      .eq('event_id', eventId)
      .eq('fighter1_id', fighter1Id)
      .eq('fighter2_id', fighter2Id)
      .single()

    if (existing) {
      // Update with results if event just completed and fight has no result yet
      if (isCompleted && (!existing.winner_id && fight.winner)) {
        const winnerId = fight.winner === fight.fighter1 ? fighter1Id : fighter2Id
        await sb.from('fights').update({
          winner_id: winnerId,
          result: fight.winner ? 'Win' : (fight.method_detail === 'Draw' ? 'Draw' : 'No Contest'),
          method: fight.method,
          method_detail: fight.method_detail,
          round: fight.round || null,
          time: fight.time || null,
          weight_class: fight.weight_class || undefined,
        }).eq('id', existing.id)
        console.log(`  📝 Updated result: ${fight.fighter1} vs ${fight.fighter2} → ${fight.method}`)
      }
      continue
    }

    // Insert new fight
    let result = 'Upcoming'
    let winnerId: string | null = null

    if (isCompleted) {
      if (fight.winner === fight.fighter1) {
        winnerId = fighter1Id
        result = 'Win'
      } else if (fight.winner === fight.fighter2) {
        winnerId = fighter2Id
        result = 'Win'
      } else if (fight.method_detail === 'Draw') {
        result = 'Draw'
      } else if (fight.method) {
        result = 'No Contest'
      }
    }

    const { error } = await sb.from('fights').insert({
      event_id: eventId,
      fighter1_id: fighter1Id,
      fighter2_id: fighter2Id,
      winner_id: winnerId,
      result,
      method: isCompleted ? fight.method : null,
      method_detail: isCompleted ? fight.method_detail : null,
      round: isCompleted ? (fight.round || null) : null,
      time: isCompleted ? (fight.time || null) : null,
      weight_class: fight.weight_class || null,
      title_fight: fight.title_fight || false,
      main_event: i === 0,
    })

    if (error) console.error(`  ❌ ${fight.fighter1} vs ${fight.fighter2}:`, error.message)
    else console.log(`  ✅ ${fight.fighter1} vs ${fight.fighter2} (${fight.weight_class || '?'})`)
  }
}

// ─── Main sync ───

async function sync() {
  console.log('🔄 UFC Event Sync starting...\n')

  // 1. Find latest completed event in our DB
  const { data: latestCompleted } = await sb.from('events')
    .select('date, name')
    .or('status.eq.completed,status.is.null')
    .order('date', { ascending: false })
    .limit(1)
    .single()

  console.log(`📅 Latest completed in DB: ${latestCompleted?.name} (${latestCompleted?.date})`)

  // 2. Scrape recently completed events from UFC Stats
  const completedEvents = await scrapeEventList('completed', 5)
  console.log(`\n📋 Recent completed events on UFC Stats:`)
  completedEvents.forEach(e => console.log(`  ${e.date} | ${e.name}`))

  // 3. Find new completed events (after our latest)
  const newCompleted = latestCompleted
    ? completedEvents.filter(e => e.date > latestCompleted.date)
    : completedEvents

  // Also check for events that were upcoming but are now completed
  const { data: upcomingInDb } = await sb.from('events')
    .select('ufc_stats_id, name, date')
    .eq('status', 'upcoming')
    .order('date', { ascending: true })

  const completedIds = new Set(completedEvents.map(e => e.ufcStatsId))
  const nowCompleted = (upcomingInDb || []).filter(e => completedIds.has(e.ufc_stats_id))

  if (newCompleted.length > 0) {
    console.log(`\n🆕 ${newCompleted.length} new completed event(s) to add:`)
    for (const event of newCompleted) {
      console.log(`\n🔍 Scraping ${event.name}...`)
      const detail = await scrapeEventFights(event.url)
      event.location = detail.location
      console.log(`  📍 ${detail.location} | ${detail.fights.length} fights`)

      const eventId = await upsertEvent(event, 'completed')
      await upsertFights(eventId, detail.fights, true)

      // Try to get poster
      const poster = await getWikipediaPoster(event.name)
      if (poster) {
        await sb.from('events').update({ poster_url: poster }).eq('id', eventId)
        console.log(`  🖼️ Poster found!`)
      }

      await sleep(1000) // Politeness delay
    }
  } else {
    console.log('\n✅ No new completed events')
  }

  // 4. Update events that transitioned from upcoming → completed
  if (nowCompleted.length > 0) {
    console.log(`\n🔄 ${nowCompleted.length} event(s) transitioned to completed:`)
    for (const event of nowCompleted) {
      const completedInfo = completedEvents.find(e => e.ufcStatsId === event.ufc_stats_id)!
      console.log(`\n🔍 Updating ${event.name} with results...`)
      const detail = await scrapeEventFights(completedInfo.url)

      // Update event status
      await sb.from('events').update({
        status: 'completed',
        location: detail.location || undefined,
      }).eq('ufc_stats_id', event.ufc_stats_id)

      // Update fights with results
      const { data: dbEvent } = await sb.from('events')
        .select('id').eq('ufc_stats_id', event.ufc_stats_id).single()
      if (dbEvent) {
        await upsertFights(dbEvent.id, detail.fights, true)
      }

      // Try to get poster
      const poster = await getWikipediaPoster(event.name)
      if (poster) {
        await sb.from('events').update({ poster_url: poster }).eq('ufc_stats_id', event.ufc_stats_id)
        console.log(`  🖼️ Poster found!`)
      }

      await sleep(1000)
    }
  }

  // 5. Scrape upcoming events
  console.log('\n📅 Syncing upcoming events...')
  const upcomingEvents = await scrapeEventList('upcoming', 10)
  console.log(`  Found ${upcomingEvents.length} upcoming events`)

  for (const event of upcomingEvents) {
    console.log(`\n🔍 ${event.name} (${event.date})`)
    const detail = await scrapeEventFights(event.url)
    event.location = detail.location

    const eventId = await upsertEvent(event, 'upcoming')
    if (detail.fights.length > 0) {
      await upsertFights(eventId, detail.fights, false)
    } else {
      console.log(`  ⏳ No fight card announced yet`)
    }
    await sleep(1000)
  }

  // Final stats
  const { count: totalEvents } = await sb.from('events').select('*', { count: 'exact', head: true })
  const { count: totalFights } = await sb.from('fights').select('*', { count: 'exact', head: true })
  const { count: upcomingCount } = await sb.from('events').select('*', { count: 'exact', head: true }).eq('status', 'upcoming')
  console.log(`\n📊 Total: ${totalEvents} events (${upcomingCount} upcoming), ${totalFights} fights`)
  console.log('✅ Sync complete!')
}

sync().catch(console.error)
