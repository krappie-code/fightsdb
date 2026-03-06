import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function findPosterUrl(wikiTitle: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=images&format=json`
    const res = await fetch(url)
    const data = await res.json()
    const pages = data?.query?.pages
    if (!pages) return null
    const page = Object.values(pages)[0] as any
    if (page?.missing !== undefined) return null
    const images = page?.images || []
    const posterImage = images.find((img: any) => {
      const title = img.title?.toLowerCase() || ''
      return title.includes('poster') && (title.endsWith('.jpg') || title.endsWith('.png'))
    })
    if (!posterImage) return null

    await sleep(300)
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

// Generate all possible Wikipedia titles for an event
function getWikiTitles(name: string): string[] {
  const titles: string[] = []

  // For numbered UFC events: "UFC 300: Jones vs. Miocic"
  const numMatch = name.match(/^UFC (\d+)/)
  if (numMatch) {
    // Just the number — this is the Wikipedia article title
    titles.push(`UFC_${numMatch[1]}`)
  }

  // For "The Ultimate Fighter" events
  if (name.includes('Ultimate Fighter')) {
    titles.push(name.replace(/\s+/g, '_'))
  }

  // For Fight Night events: try multiple Wikipedia naming conventions
  if (name.includes('Fight Night')) {
    const sub = name.replace('UFC Fight Night:', '').replace('UFC Fight Night', '').trim()
    if (sub) {
      // Try "UFC_Fight_Night:_X" and "UFC_on_ESPN:_X"
      titles.push(`UFC_Fight_Night:_${sub.replace(/\s+/g, '_')}`)
      titles.push(`UFC_on_ESPN:_${sub.replace(/\s+/g, '_')}`)
      // Also try without the colon
      titles.push(`UFC_Fight_Night_${sub.replace(/\s+/g, '_')}`)
    }
  }

  // For "UFC on FOX" / "UFC on FX" / "UFC on FUEL TV"
  if (name.match(/UFC on (FOX|FX|FUEL)/)) {
    titles.push(name.replace(/\s+/g, '_'))
    // Also try with colon
    const parts = name.split(':')
    if (parts.length === 2) {
      titles.push(parts[0].trim().replace(/\s+/g, '_') + ':_' + parts[1].trim().replace(/\s+/g, '_'))
    }
  }

  // Fallback: full name with underscores (skip colon-containing ones for Wikipedia)
  if (!name.includes(':') && titles.length === 0) {
    titles.push(name.replace(/\s+/g, '_'))
  }

  return [...new Set(titles)]
}

async function main() {
  const { data: events } = await sb.from('events')
    .select('id, name, date, poster_url')
    .is('poster_url', null)
    .order('date', { ascending: false })

  if (!events) { console.log('No events'); return }
  console.log(`🔍 Pass 2: ${events.length} events without posters\n`)

  let found = 0
  let checked = 0

  for (const event of events) {
    const titles = getWikiTitles(event.name)
    if (titles.length === 0) { checked++; continue }

    let posterUrl: string | null = null
    for (const title of titles) {
      posterUrl = await findPosterUrl(title)
      if (posterUrl) break
      await sleep(500)
    }

    if (posterUrl) {
      await sb.from('events').update({ poster_url: posterUrl }).eq('id', event.id)
      found++
      console.log(`✅ ${event.name} → ${posterUrl.split('/').pop()}`)
    }

    checked++
    if (checked % 50 === 0) {
      console.log(`📊 ${checked}/${events.length} checked, ${found} new posters found`)
    }

    await sleep(700) // be extra polite to Wikipedia
  }

  console.log(`\n📊 Done! Found ${found} new posters`)
  const { count: withPoster } = await sb.from('events').select('*', { count: 'exact', head: true }).not('poster_url', 'is', null)
  const { count: total } = await sb.from('events').select('*', { count: 'exact', head: true })
  console.log(`Total: ${withPoster}/${total} events with posters`)
}

main()
