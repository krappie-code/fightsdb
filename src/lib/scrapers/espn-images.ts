// ESPN Fighter Image Scraper — fetches headshots from ESPN API
// Run with: npx tsx src/lib/scrapers/espn-images.ts
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

async function getESPNHeadshot(fighterName: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(fighterName)
    const url = `https://site.web.api.espn.com/apis/common/v3/search?query=${q}&limit=1&type=player&sport=mma`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FightsDB/1.0)' }
    })
    const data = await res.json()
    const items = data.items || []

    if (items.length > 0) {
      const player = items[0]
      const image = player.image?.default || player.image?.href
      if (image && !image.includes('no-headshot')) return image
    }
    return null
  } catch {
    return null
  }
}

async function main() {
  console.log('📸 ESPN Image Scraper\n')

  // Get fighters missing images, in batches
  let offset = 0
  const batchSize = 100
  let totalFound = 0
  let totalProcessed = 0

  while (true) {
    const { data: fighters } = await supabase
      .from('fighters')
      .select('id, name')
      .is('image_url', null)
      .range(offset, offset + batchSize - 1)
      .order('name')

    if (!fighters || fighters.length === 0) break

    for (const fighter of fighters) {
      totalProcessed++
      const image = await getESPNHeadshot(fighter.name)
      if (image) {
        await supabase.from('fighters').update({ image_url: image }).eq('id', fighter.id)
        totalFound++
        console.log(`  ✅ ${fighter.name}`)
      }
      if (totalProcessed % 50 === 0) {
        console.log(`  [${totalProcessed}] ${totalFound} images found`)
      }
      await delay(200) // politeness
    }

    offset += batchSize
  }

  console.log(`\n✅ Done! Found ${totalFound} images out of ${totalProcessed} fighters checked`)
}

main().catch(console.error)
