// Wikipedia Image Scraper — fetches fighter photos from Wikipedia
// Run with: npx tsx src/lib/scrapers/wikipedia-images.ts
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
const WIKI_API = 'https://en.wikipedia.org/w/api.php'

async function getWikipediaImage(name: string): Promise<string | null> {
  try {
    for (const title of [`${name} (fighter)`, `${name} (mixed martial artist)`, name]) {
      const params = new URLSearchParams({
        action: 'query',
        titles: title,
        prop: 'pageimages',
        format: 'json',
        pithumbsize: '400',
        redirects: '1'
      })
      const res = await fetch(`${WIKI_API}?${params}`, {
        headers: { 'User-Agent': 'FightsDB/1.0 (https://fightsdb.vercel.app)' }
      })
      const data = await res.json()
      const pages = data.query?.pages || {}
      for (const page of Object.values(pages) as any[]) {
        if (page.thumbnail?.source) return page.thumbnail.source
      }
    }
    return null
  } catch {
    return null
  }
}

async function main() {
  console.log('📸 Wikipedia Image Scraper\n')

  // Get ALL fighters without images upfront
  const allMissing: { id: string; name: string }[] = []
  let offset = 0
  while (true) {
    const { data } = await supabase
      .from('fighters')
      .select('id, name')
      .is('image_url', null)
      .order('name')
      .range(offset, offset + 999)
    if (!data || data.length === 0) break
    allMissing.push(...data)
    offset += data.length
    if (data.length < 1000) break
  }

  console.log(`Found ${allMissing.length} fighters without images\n`)

  let totalFound = 0
  for (let i = 0; i < allMissing.length; i++) {
    const fighter = allMissing[i]
    const image = await getWikipediaImage(fighter.name)
    if (image) {
      await supabase.from('fighters').update({ image_url: image }).eq('id', fighter.id)
      totalFound++
      console.log(`  ✅ ${fighter.name}`)
    }
    if ((i + 1) % 50 === 0) {
      console.log(`  [${i + 1}/${allMissing.length}] ${totalFound} images found`)
    }
    await delay(500)
  }

  console.log(`\n✅ Done! Found ${totalFound} images out of ${allMissing.length} fighters checked`)
}

main().catch(console.error)
