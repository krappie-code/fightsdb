import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const CRON_SECRET = process.env.CRON_SECRET

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

interface EventInfo {
  name: string; date: string; ufcStatsId: string; url: string; location?: string
}

interface FightInfo {
  fighter1: string; fighter2: string; winner?: string
  method?: string; method_detail?: string; round?: number; time?: string
  weight_class?: string; title_fight?: boolean
  fighter1_url?: string; fighter2_url?: string
}

async function scrapeEventList(type: 'upcoming' | 'completed', limit = 5): Promise<EventInfo[]> {
  const html = await fetchHtml(`http://ufcstats.com/statistics/events/${type}`)
  const events: EventInfo[] = []
  const eventLinks = [...html.matchAll(/<a href="(http:\/\/ufcstats\.com\/event-details\/([^"]+))"[^>]*>([\s\S]*?)<\/a>/g)]
  const dates = [...html.matchAll(/<span class="b-statistics__date">\s*([^<]+)/g)]

  for (let i = 0; i < Math.min(eventLinks.length, limit); i++) {
    const name = eventLinks[i][3].replace(/<[^>]+>/g, '').trim()
    if (name) events.push({
      name,
      date: dates[i]?.[1]?.trim() ? new Date(dates[i][1].trim()).toISOString().split('T')[0] : '',
      ufcStatsId: eventLinks[i][2],
      url: eventLinks[i][1],
    })
  }
  return events
}

async function scrapeEventFights(url: string): Promise<{ fights: FightInfo[]; location: string }> {
  const html = await fetchHtml(url)
  const locMatch = html.match(/Location:\s*<\/i>\s*([^<]+)/)
  const location = locMatch?.[1]?.trim() || ''
  const fights: FightInfo[] = []
  const rows = html.split('<tr class="b-fight-details__table-row')

  for (const row of rows) {
    if (!row.includes('fight-details')) continue
    const links = [...row.matchAll(/<a[^>]*href="(http:\/\/ufcstats\.com\/fighter-details\/[^"]*)"[^>]*>\s*([^<]+?)\s*<\/a>/g)]
    if (links.length < 2) continue

    const flagMatch = row.match(/<i class="b-flag__text">(win|loss|draw|nc)/i)
    const flag = flagMatch?.[1]?.toLowerCase()

    const wcMatch = row.match(/((?:Women'?s\s+)?(?:Light\s+)?(?:Heavy|Middle|Welter|Feather|Bantam|Fly|Super\s+Heavy|Open|Catch)\s*weight|Lightweight)\s*<br/i)

    const pTexts = [...row.matchAll(/<p class="b-fight-details__table-text"[^>]*>([\s\S]*?)<\/p>/g)]
      .map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean)

    let method = '', method_detail = '', round = 0, time = ''
    for (let i = 0; i < pTexts.length; i++) {
      if (pTexts[i].match(/^\d:\d{2}$/)) {
        time = pTexts[i]
        if (i > 0 && pTexts[i - 1].match(/^\d+$/)) round = parseInt(pTexts[i - 1])
        if (i > 1) method_detail = pTexts[i - 2]
        break
      }
    }
    const subTech = /choke|armbar|triangle|kimura|americana|heel hook|kneebar|lock|crank|slicer|twister/i
    const koTech = /punch|kick|knee|elbow|slam|strikes|stomp|soccer/i
    if (method_detail.startsWith('KO')) method = 'KO/TKO'
    else if (method_detail.startsWith('SUB')) method = 'Submission'
    else if (method_detail.includes('DEC')) method = 'Decision'
    else if (method_detail.startsWith('DQ')) method = 'DQ'
    else if (subTech.test(method_detail)) method = 'Submission'
    else if (koTech.test(method_detail)) method = 'KO/TKO'
    else if (method_detail) method = 'KO/TKO'

    fights.push({
      fighter1: links[0][2].trim(), fighter2: links[1][2].trim(),
      winner: flag === 'win' ? links[0][2].trim() : undefined,
      method, method_detail, round, time,
      weight_class: wcMatch?.[1]?.trim() || '',
      title_fight: row.includes('belt.png'),
      fighter1_url: links[0][1], fighter2_url: links[1][1],
    })
  }
  return { fights, location }
}

export async function GET(request: Request) {
  // Verify cron secret (optional — if set, require it)
  if (CRON_SECRET) {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret') || request.headers.get('authorization')?.replace('Bearer ', '')
    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const sb = getSupabase()
  const log: string[] = []

  try {
    // 1. Check for newly completed events
    const { data: latestCompleted } = await sb.from('events')
      .select('date')
      .or('status.eq.completed,status.is.null')
      .order('date', { ascending: false })
      .limit(1)
      .single()

    const completedEvents = await scrapeEventList('completed', 5)

    const newCompleted = latestCompleted
      ? completedEvents.filter(e => e.date > latestCompleted.date)
      : completedEvents

    // Check upcoming→completed transitions
    const { data: upcomingInDb } = await sb.from('events')
      .select('ufc_stats_id, name').eq('status', 'upcoming')

    const completedIds = new Set(completedEvents.map(e => e.ufcStatsId))
    const transitioned = (upcomingInDb || []).filter(e => completedIds.has(e.ufc_stats_id))

    // Process new completed events
    for (const event of [...newCompleted, ...transitioned.map(t => completedEvents.find(c => c.ufcStatsId === t.ufc_stats_id)!).filter(Boolean)]) {
      const detail = await scrapeEventFights(event.url)
      const { data: existing } = await sb.from('events').select('id').eq('ufc_stats_id', event.ufcStatsId).single()

      let eventId: string
      if (existing) {
        await sb.from('events').update({ status: 'completed', location: detail.location || undefined }).eq('id', existing.id)
        eventId = existing.id
      } else {
        const { data: created } = await sb.from('events')
          .insert({ name: event.name, date: event.date, location: detail.location, ufc_stats_id: event.ufcStatsId, status: 'completed' })
          .select('id').single()
        eventId = created!.id
      }

      // Upsert fights with results
      for (let i = 0; i < detail.fights.length; i++) {
        const f = detail.fights[i]
        const f1 = await getOrCreate(sb, f.fighter1, f.fighter1_url)
        const f2 = await getOrCreate(sb, f.fighter2, f.fighter2_url)
        const winnerId = f.winner === f.fighter1 ? f1 : f.winner === f.fighter2 ? f2 : null

        const { data: ex } = await sb.from('fights').select('id').eq('event_id', eventId).eq('fighter1_id', f1).eq('fighter2_id', f2).single()
        if (ex) {
          await sb.from('fights').update({
            winner_id: winnerId, result: winnerId ? 'Win' : (f.method_detail === 'Draw' ? 'Draw' : 'No Contest'),
            method: f.method, method_detail: f.method_detail, round: f.round || null, time: f.time || null,
            weight_class: f.weight_class || undefined,
          }).eq('id', ex.id)
        } else {
          await sb.from('fights').insert({
            event_id: eventId, fighter1_id: f1, fighter2_id: f2,
            winner_id: winnerId, result: winnerId ? 'Win' : (f.method ? 'No Contest' : null),
            method: f.method || null, method_detail: f.method_detail || null,
            round: f.round || null, time: f.time || null,
            weight_class: f.weight_class || null, title_fight: f.title_fight || false, main_event: i === 0,
          })
        }
      }
      log.push(`✅ Completed: ${event.name} (${detail.fights.length} fights)`)
      await sleep(1000)
    }

    // 2. Sync upcoming events
    const upcomingEvents = await scrapeEventList('upcoming', 10)
    for (const event of upcomingEvents) {
      const detail = await scrapeEventFights(event.url)
      const { data: existing } = await sb.from('events').select('id').eq('ufc_stats_id', event.ufcStatsId).single()

      let eventId: string
      if (existing) {
        eventId = existing.id
      } else {
        const { data: created } = await sb.from('events')
          .insert({ name: event.name, date: event.date, location: detail.location, ufc_stats_id: event.ufcStatsId, status: 'upcoming' })
          .select('id').single()
        eventId = created!.id
        log.push(`📅 New upcoming: ${event.name}`)
      }

      // Upsert fight card
      for (let i = 0; i < detail.fights.length; i++) {
        const f = detail.fights[i]
        const f1 = await getOrCreate(sb, f.fighter1, f.fighter1_url)
        const f2 = await getOrCreate(sb, f.fighter2, f.fighter2_url)
        const { data: ex } = await sb.from('fights').select('id').eq('event_id', eventId).eq('fighter1_id', f1).eq('fighter2_id', f2).single()
        if (!ex) {
          await sb.from('fights').insert({
            event_id: eventId, fighter1_id: f1, fighter2_id: f2,
            result: null, weight_class: f.weight_class || null,
            title_fight: f.title_fight || false, main_event: i === 0,
          })
        }
      }
      await sleep(500)
    }

    if (log.length === 0) log.push('No changes')

    return NextResponse.json({ ok: true, log, timestamp: new Date().toISOString() })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

async function getOrCreate(sb: any, name: string, url?: string): Promise<string> {
  const { data } = await sb.from('fighters').select('id').eq('name', name).limit(1).single()
  if (data) return data.id
  const { data: created } = await sb.from('fighters').insert({ name, ufc_stats_url: url }).select('id').single()
  return created!.id
}
