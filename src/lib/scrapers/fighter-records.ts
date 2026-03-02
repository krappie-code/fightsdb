// Fighter Records Scraper — updates W-L-D from UFC Stats
// Run with: npx tsx src/lib/scrapers/fighter-records.ts

import * as cheerio from 'cheerio'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
})

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

interface FighterRecord {
  name: string
  wins: number
  losses: number
  draws: number
  height?: string
  weight_class?: string
  reach?: number
  stance?: string
}

async function scrapeFighterList(char: string): Promise<FighterRecord[]> {
  const url = `http://ufcstats.com/statistics/fighters?char=${char}&page=all`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FightsDB/1.0)' }
  })
  const html = await res.text()
  const $ = cheerio.load(html)
  
  const fighters: FighterRecord[] = []
  
  $('tr.b-statistics__table-row').each((_, row) => {
    const $cols = $(row).find('td')
    if ($cols.length < 10) return
    
    const firstName = $cols.eq(0).text().trim()
    const lastName = $cols.eq(1).text().trim()
    if (!firstName && !lastName) return
    
    const name = `${firstName} ${lastName}`.trim()
    const height = $cols.eq(3).text().trim()
    const weight = $cols.eq(4).text().trim()
    const reachStr = $cols.eq(5).text().trim()
    const stance = $cols.eq(6).text().trim()
    const wins = parseInt($cols.eq(7).text().trim()) || 0
    const losses = parseInt($cols.eq(8).text().trim()) || 0
    const draws = parseInt($cols.eq(9).text().trim()) || 0
    
    const reach = parseFloat(reachStr) || undefined
    
    fighters.push({
      name,
      wins,
      losses,
      draws,
      height: height !== '--' ? height : undefined,
      weight_class: weight !== '--' ? weight : undefined,
      reach,
      stance: (stance === 'Orthodox' || stance === 'Southpaw' || stance === 'Switch') ? stance : undefined,
    })
  })
  
  return fighters
}

async function main() {
  console.log('📊 Fighter Records Scraper\n')
  
  const allFighters: FighterRecord[] = []
  const chars = 'abcdefghijklmnopqrstuvwxyz'.split('')
  
  for (const char of chars) {
    const fighters = await scrapeFighterList(char)
    allFighters.push(...fighters)
    process.stdout.write(`  ${char.toUpperCase()}: ${fighters.length} fighters\r`)
    await delay(500)
  }
  
  console.log(`\nScraped ${allFighters.length} fighter records from UFC Stats\n`)
  
  // Build lookup by name
  const recordMap = new Map<string, FighterRecord>()
  for (const f of allFighters) {
    recordMap.set(f.name.toLowerCase(), f)
  }
  
  // Get our fighters
  const { data: dbFighters } = await supabase
    .from('fighters')
    .select('id, name, wins, losses, draws')
  
  if (!dbFighters) return
  
  let updated = 0
  
  for (const dbF of dbFighters) {
    const record = recordMap.get(dbF.name.toLowerCase())
    if (record && (record.wins !== dbF.wins || record.losses !== dbF.losses || record.draws !== dbF.draws)) {
      const updateData: any = {
        wins: record.wins,
        losses: record.losses,
        draws: record.draws,
      }
      if (record.height) updateData.height = record.height
      if (record.reach) updateData.reach = record.reach
      if (record.stance) updateData.stance = record.stance
      
      await supabase
        .from('fighters')
        .update(updateData)
        .eq('id', dbF.id)
      
      updated++
    }
  }
  
  console.log(`✅ Updated ${updated} fighter records`)
}

main().catch(console.error)
