// Event Poster Scraper — fetches from UFC Collectibles Shopify API
// Run with: npx tsx src/lib/scrapers/poster-scraper.ts

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

const SHOP_API = 'https://ufccollectibles.com/collections/ufc-autographed-event-posters/products.json'

interface ShopProduct {
  title: string
  images: { src: string }[]
}

function normalizeEventName(name: string): string {
  return name
    .toLowerCase()
    .replace(/autographed event poster/i, '')
    .replace(/first edition/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

function normalizeDbEventName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

async function fetchAllPosters(): Promise<ShopProduct[]> {
  const products: ShopProduct[] = []
  let page = 1
  
  while (true) {
    const res = await fetch(`${SHOP_API}?limit=50&page=${page}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const data = await res.json()
    const batch = data.products || []
    if (batch.length === 0) break
    products.push(...batch)
    page++
    // Don't hammer the API
    await new Promise(r => setTimeout(r, 500))
  }
  
  return products
}

async function main() {
  console.log('🖼️  Fetching event posters from UFC Collectibles...\n')
  
  // Get all products from shop
  const products = await fetchAllPosters()
  console.log(`Found ${products.length} products\n`)
  
  // Get events without posters
  const { data: events } = await supabase
    .from('events')
    .select('id, name, poster_url')
    .order('date', { ascending: false })
  
  if (!events) {
    console.error('❌ Failed to fetch events')
    return
  }
  
  let updated = 0
  let alreadyHad = 0
  
  for (const event of events) {
    if (event.poster_url) {
      alreadyHad++
      continue
    }
    
    const eventNorm = normalizeDbEventName(event.name)
    
    // Find matching product
    let bestMatch: ShopProduct | null = null
    
    for (const product of products) {
      const prodNorm = normalizeEventName(product.title)
      
      // Check if the normalized names match closely
      if (prodNorm.includes(eventNorm) || eventNorm.includes(prodNorm)) {
        bestMatch = product
        break
      }
      
      // Try matching key parts (e.g., "ufc325" or "morenokav")
      // Extract UFC number or fighter names
      const eventParts = event.name.match(/UFC\s*(\d+)|(\w+)\s+vs\.?\s+(\w+)/i)
      const prodParts = product.title.match(/UFC\s*(\d+)|(\w+)\s+vs\.?\s+(\w+)/i)
      
      if (eventParts && prodParts) {
        // Match by UFC number
        if (eventParts[1] && prodParts[1] && eventParts[1] === prodParts[1]) {
          bestMatch = product
          break
        }
        // Match by fighter last names
        if (eventParts[2] && eventParts[3] && prodParts[2] && prodParts[3]) {
          const e2 = eventParts[2].toLowerCase()
          const e3 = eventParts[3].toLowerCase()
          const p2 = prodParts[2].toLowerCase()
          const p3 = prodParts[3].toLowerCase()
          if ((e2 === p2 && e3 === p3) || (e2 === p3 && e3 === p2)) {
            bestMatch = product
            break
          }
        }
      }
    }
    
    if (bestMatch && bestMatch.images?.length > 0) {
      const posterUrl = bestMatch.images[0].src
      await supabase
        .from('events')
        .update({ poster_url: posterUrl })
        .eq('id', event.id)
      updated++
      console.log(`✅ ${event.name}`)
      console.log(`   → ${posterUrl.substring(0, 80)}...`)
    } else {
      console.log(`❌ ${event.name} — no match`)
    }
  }
  
  console.log(`\n✅ Updated ${updated} event posters (${alreadyHad} already had posters)`)
}

main().catch(console.error)
