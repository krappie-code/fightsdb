// Fix title fights — re-scrapes UFC Stats to detect belt.png indicator
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import * as cheerio from 'cheerio'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

interface TitleFightInfo {
  ufc_stats_id: string
  is_title: boolean
  is_perf: boolean
}

async function scrapeEventTitleFights(eventUrl: string): Promise<TitleFightInfo[]> {
  const res = await fetch(eventUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FightsDB/1.0)' }
  })
  const html = await res.text()
  const $ = cheerio.load(html)
  const results: TitleFightInfo[] = []

  $('tr.b-fight-details__table-row.js-fight-details-click').each((_, row) => {
    const $row = $(row)
    const fightLink = $row.attr('data-link') || $row.find('a').first().attr('href') || ''
    const fightId = fightLink.split('/').pop() || ''

    // Check for belt.png image (title fight indicator)
    const imgs = $row.find('img').map((_, img) => $(img).attr('src') || '').get()
    const isTitle = imgs.some(src => src.includes('belt.png'))
    const isPerf = imgs.some(src => src.includes('perf.png'))

    if (fightId) {
      results.push({ ufc_stats_id: fightId, is_title: isTitle, is_perf: isPerf })
    }
  })

  return results
}

async function main() {
  console.log('🏆 Fixing title fight flags...\n')

  // Get all events with their UFC Stats IDs
  const allEvents: { id: string; name: string; ufc_stats_id: string }[] = []
  let offset = 0
  while (true) {
    const { data } = await supabase
      .from('events')
      .select('id, name, ufc_stats_id')
      .not('ufc_stats_id', 'is', null)
      .neq('ufc_stats_id', 'ufc1-manual')
      .order('date', { ascending: false })
      .range(offset, offset + 499)
    if (!data || data.length === 0) break
    allEvents.push(...data)
    offset += data.length
    if (data.length < 500) break
  }

  console.log(`Found ${allEvents.length} events to check\n`)

  let totalTitleFights = 0
  let totalInterim = 0
  let totalUpdated = 0

  for (let i = 0; i < allEvents.length; i++) {
    const event = allEvents[i]
    const url = `http://ufcstats.com/event-details/${event.ufc_stats_id}`

    try {
      const titleInfo = await scrapeEventTitleFights(url)
      const titleFights = titleInfo.filter(f => f.is_title)

      if (titleFights.length > 0) {
        console.log(`[${i + 1}/${allEvents.length}] ${event.name} — ${titleFights.length} title fight(s)`)

        for (const tf of titleFights) {
          // Get the fight to check weight class for interim detection
          const { data: fight } = await supabase
            .from('fights')
            .select('id, weight_class, method_detail')
            .eq('ufc_stats_id', tf.ufc_stats_id)
            .single()

          if (fight) {
            const methodLower = (fight.method_detail || '').toLowerCase()
            const isInterim = methodLower.includes('interim') ||
              // Check event name for interim indicators
              event.name.toLowerCase().includes('interim')

            const titleType = isInterim ? 'interim' : 'undisputed'

            const { error } = await supabase
              .from('fights')
              .update({
                title_fight: true,
                title_fight_type: titleType
              })
              .eq('id', fight.id)

            if (!error) {
              totalUpdated++
              totalTitleFights++
              if (isInterim) totalInterim++
              console.log(`  ✅ ${fight.weight_class} — ${titleType}`)
            }
          }
        }
      }
    } catch (err) {
      console.error(`  ❌ Error on ${event.name}: ${err}`)
    }

    await delay(1000) // politeness

    if ((i + 1) % 50 === 0) {
      console.log(`\n⏳ Progress: ${i + 1}/${allEvents.length} events, ${totalTitleFights} title fights found\n`)
    }
  }

  console.log(`\n✅ Done!`)
  console.log(`📊 ${totalTitleFights} title fights found (${totalInterim} interim)`)
  console.log(`📝 ${totalUpdated} fights updated`)
}

main().catch(console.error)
