import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function getPoster(eventName: string): Promise<string | null> {
  const titles = [
    eventName.replace(/\s+/g, '_'),
    eventName.replace(/\s+/g, '_').replace(/:/g, ''),
    eventName.replace(/\s+/g, '_').replace('Fight_Night:_', 'Fight_Night_'),
  ]

  for (const title of titles) {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=images&format=json`
      )
      const data = await res.json()
      const pages = data?.query?.pages || {}
      const page = Object.values(pages)[0] as any
      if (!page?.images || page.pageid === undefined) continue

      const posterFile = page.images.find(
        (img: any) => img.title.toLowerCase().includes('poster') && img.title.match(/\.(jpg|jpeg|png)$/i)
      )
      if (!posterFile) continue

      const infoRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(posterFile.title)}&prop=imageinfo&iiprop=url&format=json`
      )
      const infoData = await infoRes.json()
      const infoPages = infoData?.query?.pages || {}
      const infoPage = Object.values(infoPages)[0] as any
      const url = infoPage?.imageinfo?.[0]?.url
      if (url) return url
    } catch {}
  }
  return null
}

async function main() {
  const { data: events } = await sb
    .from('events')
    .select('id, name, date')
    .is('poster_url', null)
    .order('date', { ascending: false })

  console.log(`Checking ${events?.length} events for Wikipedia posters...\n`)

  let found = 0
  let checked = 0

  for (const event of events || []) {
    const poster = await getPoster(event.name)
    checked++
    if (poster) {
      await sb.from('events').update({ poster_url: poster }).eq('id', event.id)
      found++
      console.log(`✅ ${event.name}`)
    }
    if (checked % 50 === 0) {
      console.log(`  ... ${checked}/${events?.length} checked, ${found} found`)
    }
    await sleep(600)
  }

  console.log(`\n📊 Found posters for ${found} / ${checked} events`)
  const { count } = await sb.from('events').select('*', { count: 'exact', head: true }).is('poster_url', null)
  console.log(`Remaining without posters: ${count}`)
}

main().catch(console.error)
