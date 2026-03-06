import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// Convert event name to Wikipedia article title
function eventToWikiTitle(name: string): string[] {
  // "UFC 300: Jones vs. Miocic" → ["UFC_300", "UFC_300:_Jones_vs._Miocic"]
  // "UFC Fight Night: Holloway vs. Rodriguez" → ["UFC_Fight_Night:_Holloway_vs._Rodriguez", "UFC_on_ESPN:_Holloway_vs._Rodriguez"]
  const titles: string[] = []

  // Try the full name
  titles.push(name.replace(/\s+/g, '_'))

  // Try just the UFC number part
  const numMatch = name.match(/^(UFC \d+)/)
  if (numMatch) {
    titles.push(numMatch[1].replace(/\s+/g, '_'))
  }

  // Fight Night variations
  if (name.includes('Fight Night')) {
    const sub = name.replace('UFC Fight Night:', '').trim()
    titles.push(`UFC_Fight_Night:_${sub.replace(/\s+/g, '_')}`)
    titles.push(`UFC_on_ESPN:_${sub.replace(/\s+/g, '_')}`)
  }

  return [...new Set(titles)]
}

async function findPosterUrl(wikiTitle: string): Promise<string | null> {
  try {
    // Step 1: Get images for the article
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=images&format=json`
    const res = await fetch(url)
    const data = await res.json()

    const pages = data?.query?.pages
    if (!pages) return null

    const page = Object.values(pages)[0] as any
    if (page?.missing !== undefined) return null

    const images = page?.images || []

    // Find poster image
    const posterImage = images.find((img: any) => {
      const title = img.title?.toLowerCase() || ''
      return title.includes('poster') && (title.endsWith('.jpg') || title.endsWith('.png'))
    })

    if (!posterImage) return null

    // Step 2: Get the actual URL
    const fileTitle = posterImage.title.replace(/\s+/g, '_')
    const infoUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url&format=json`
    const infoRes = await fetch(infoUrl)
    const infoData = await infoRes.json()

    const infoPages = infoData?.query?.pages
    if (!infoPages) return null

    const infoPage = Object.values(infoPages)[0] as any
    return infoPage?.imageinfo?.[0]?.url || null
  } catch {
    return null
  }
}

async function main() {
  // Get all events without posters
  const { data: events } = await sb.from('events')
    .select('id, name, date, poster_url')
    .is('poster_url', null)
    .order('date', { ascending: false })

  if (!events) { console.log('No events found'); return }

  console.log(`🔍 Searching Wikipedia posters for ${events.length} events...\n`)

  let found = 0
  let notFound = 0

  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    const titles = eventToWikiTitle(event.name)

    let posterUrl: string | null = null

    for (const title of titles) {
      posterUrl = await findPosterUrl(title)
      if (posterUrl) break
      await sleep(200) // politeness
    }

    if (posterUrl) {
      await sb.from('events').update({ poster_url: posterUrl }).eq('id', event.id)
      found++
      console.log(`  ✅ ${event.name} → ${posterUrl.split('/').pop()}`)
    } else {
      notFound++
      if (i < 20 || event.name.match(/^UFC \d/)) {
        // Only log numbered UFC events that are missing (there are many Fight Nights)
        console.log(`  ❌ ${event.name}`)
      }
    }

    // Rate limit
    await sleep(500)

    // Progress every 50
    if ((i + 1) % 50 === 0) {
      console.log(`\n📊 Progress: ${i + 1}/${events.length} (found=${found}, missing=${notFound})\n`)
    }
  }

  console.log(`\n📊 Done! Found ${found} posters, ${notFound} still missing`)

  const { count: withPoster } = await sb.from('events').select('*', { count: 'exact', head: true }).not('poster_url', 'is', null)
  const { count: total } = await sb.from('events').select('*', { count: 'exact', head: true })
  console.log(`Total events with posters: ${withPoster}/${total}`)
}

main()
