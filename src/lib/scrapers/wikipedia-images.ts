// Wikipedia Image Scraper — fetches fighter photos and event posters
// Run with: npx tsx src/lib/scrapers/wikipedia-images.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
})

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

const WIKI_API = 'https://en.wikipedia.org/w/api.php'

async function getWikipediaImage(title: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      action: 'query',
      titles: title,
      prop: 'pageimages',
      format: 'json',
      pithumbsize: '400',
      redirects: '1'
    })
    const res = await fetch(`${WIKI_API}?${params}`)
    const data = await res.json()
    const pages = data.query?.pages || {}
    for (const page of Object.values(pages) as any[]) {
      if (page.thumbnail?.source) return page.thumbnail.source
    }
    return null
  } catch {
    return null
  }
}

async function getEventPosterUrl(eventName: string): Promise<string | null> {
  try {
    // Convert event name to Wikipedia title format
    const wikiTitle = eventName.replace(/\s+/g, '_').replace(/:/g, ':')
    
    // First get the list of images on the page
    const params = new URLSearchParams({
      action: 'query',
      titles: wikiTitle,
      prop: 'images',
      format: 'json',
      redirects: '1'
    })
    const res = await fetch(`${WIKI_API}?${params}`)
    const data = await res.json()
    const pages = data.query?.pages || {}
    
    let posterFile: string | null = null
    for (const page of Object.values(pages) as any[]) {
      for (const img of page.images || []) {
        if (img.title?.toLowerCase().includes('poster')) {
          posterFile = img.title
          break
        }
      }
    }
    
    if (!posterFile) return null
    
    // Now get the actual URL
    const imgParams = new URLSearchParams({
      action: 'query',
      titles: posterFile,
      prop: 'imageinfo',
      iiprop: 'url',
      iiurlwidth: '400',
      format: 'json'
    })
    const imgRes = await fetch(`${WIKI_API}?${imgParams}`)
    const imgData = await imgRes.json()
    const imgPages = imgData.query?.pages || {}
    for (const page of Object.values(imgPages) as any[]) {
      const info = page.imageinfo?.[0]
      if (info?.thumburl) return info.thumburl
      if (info?.url) return info.url
    }
    return null
  } catch {
    return null
  }
}

async function seedFighterImages() {
  console.log('👤 Fetching fighter images from Wikipedia...\n')
  
  const { data: fighters } = await supabase
    .from('fighters')
    .select('id, name, image_url')
    .is('image_url', null)
    .order('name')
  
  if (!fighters?.length) {
    console.log('No fighters need images')
    return
  }
  
  console.log(`Processing ${fighters.length} fighters...\n`)
  
  let found = 0
  let batch = 0
  
  for (const fighter of fighters) {
    // Convert fighter name to Wikipedia format
    const wikiTitle = fighter.name.replace(/\s+/g, '_')
    const imageUrl = await getWikipediaImage(wikiTitle)
    
    if (imageUrl) {
      await supabase
        .from('fighters')
        .update({ image_url: imageUrl })
        .eq('id', fighter.id)
      found++
      console.log(`  ✅ ${fighter.name}`)
    } else {
      // Try with "(fighter)" suffix for disambiguation
      const altUrl = await getWikipediaImage(wikiTitle + '_(fighter)')
      if (altUrl) {
        await supabase
          .from('fighters')
          .update({ image_url: altUrl })
          .eq('id', fighter.id)
        found++
        console.log(`  ✅ ${fighter.name} (disambiguated)`)
      }
    }
    
    batch++
    // Rate limit: ~2 requests per second (2 attempts per fighter worst case)
    if (batch % 5 === 0) {
      await delay(1000)
      process.stdout.write(`  [${batch}/${fighters.length}] ${found} images found\r`)
    }
  }
  
  console.log(`\n\n✅ Fighter images: ${found}/${fighters.length} found`)
}

async function seedEventPosters() {
  console.log('\n📅 Fetching event posters from Wikipedia...\n')
  
  const { data: events } = await supabase
    .from('events')
    .select('id, name, poster_url')
    .is('poster_url', null)
    .order('date', { ascending: false })
  
  if (!events?.length) {
    console.log('No events need posters')
    return
  }
  
  let found = 0
  
  for (const event of events) {
    const posterUrl = await getEventPosterUrl(event.name)
    await delay(500)
    
    if (posterUrl) {
      await supabase
        .from('events')
        .update({ poster_url: posterUrl })
        .eq('id', event.id)
      found++
      console.log(`  ✅ ${event.name}`)
    } else {
      console.log(`  ❌ ${event.name}`)
    }
  }
  
  console.log(`\n✅ Event posters: ${found}/${events.length} found`)
}

async function main() {
  console.log('🖼️  Wikipedia Image Scraper\n')
  await seedEventPosters()
  await seedFighterImages()
  console.log('\n🎉 Done!')
}

main().catch(console.error)
