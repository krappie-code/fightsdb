// ESPN Fighter Image Scraper
// Run with: npx tsx src/lib/scrapers/espn-images.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Set env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
})

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
      const headshot = items[0].headshot?.href
      const espnName = items[0].displayName?.toLowerCase()
      const searchName = fighterName.toLowerCase()
      
      // Verify the name matches (avoid false positives)
      if (headshot && espnName) {
        const espnParts = espnName.split(' ')
        const searchParts = searchName.split(' ')
        // Check last name matches at minimum
        const espnLast = espnParts[espnParts.length - 1]
        const searchLast = searchParts[searchParts.length - 1]
        if (espnLast === searchLast) {
          return headshot
        }
      }
    }
    return null
  } catch {
    return null
  }
}

async function main() {
  console.log('🏈 ESPN Fighter Image Scraper\n')
  
  // Get fighters without images
  const { data: fighters } = await supabase
    .from('fighters')
    .select('id, name, image_url')
    .is('image_url', null)
    .order('name')
  
  if (!fighters?.length) {
    console.log('All fighters already have images!')
    return
  }
  
  console.log(`Processing ${fighters.length} fighters without images...\n`)
  
  let found = 0
  
  for (let i = 0; i < fighters.length; i++) {
    const fighter = fighters[i]
    const headshot = await getESPNHeadshot(fighter.name)
    
    if (headshot) {
      await supabase
        .from('fighters')
        .update({ image_url: headshot })
        .eq('id', fighter.id)
      found++
      console.log(`  ✅ ${fighter.name}`)
    }
    
    // Rate limit: ~3 requests per second
    await delay(350)
    
    if ((i + 1) % 25 === 0) {
      console.log(`  [${i + 1}/${fighters.length}] ${found} images found`)
    }
  }
  
  console.log(`\n✅ ESPN images: ${found}/${fighters.length} found`)
}

main().catch(console.error)
