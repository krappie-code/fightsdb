import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const subTech = /choke|armbar|triangle|kimura|americana|heel hook|kneebar|lock|crank|slicer|twister/i
const koTech = /punch|kick|knee|elbow|slam|strikes|stomp|soccer/i

function deriveMethod(detail: string): string {
  if (!detail) return ''
  if (detail.startsWith('KO')) return 'KO/TKO'
  if (detail.startsWith('SUB')) return 'Submission'
  if (detail.includes('DEC')) return 'Decision'
  if (detail.startsWith('DQ')) return 'DQ'
  if (subTech.test(detail)) return 'Submission'
  if (koTech.test(detail)) return 'KO/TKO'
  return 'KO/TKO'
}

async function main() {
  // Step 1: Delete orphan null-result fights that have duplicates with results
  const toDelete = [
    '149aee96-e420-41ec-a1d0-ee136f117507',
    '1fc7b491-c4f4-4e2a-bb90-8d5ae5ec4656',
    '29512ea2-73d9-4471-8b76-b398fa082535',
    '891b2d13-b09f-46ec-9b8e-d7c7cb9d5632',
    '24f36e9b-3743-4f8a-85cc-921eea87538b',
    'da797d44-be83-4cbb-ace4-93a35ffe5ea4',
    '13b2960a-780f-45e6-b86f-ac5869ca4e4d',
    '06469669-f67d-4444-930d-daf773593c78',
    'f5fc50ca-88bb-4201-8adc-f4ac4751a6b4',
  ]

  console.log('Step 1: Deleting duplicate null-result fights...')
  for (const id of toDelete) {
    const { error } = await sb.from('fights').delete().eq('id', id)
    console.log(error ? `  ❌ ${id}: ${error.message}` : `  🗑️ ${id}`)
  }

  // Step 2: Fix remaining null-result fights in completed events
  console.log('\nStep 2: Fixing remaining null-result fights...')

  const eventIds = [
    { ufcStatsId: '5c38639f860a5542' }, // Adesanya vs Pyfer
    { ufcStatsId: '69108cb8b32efe04' }, // Evloev vs Murphy
  ]

  for (const ev of eventIds) {
    const { data: evData } = await sb.from('events').select('id, name').eq('ufc_stats_id', ev.ufcStatsId).single()
    if (!evData) continue
    console.log(`\n  ${evData.name}:`)

    const html = await (await fetch(`http://ufcstats.com/event-details/${ev.ufcStatsId}`)).text()
    const rows = html.split(/<tr class="b-fight-details__table-row/).slice(1)

    for (const row of rows) {
      if (!row.includes('fight-details')) continue
      const links = [...row.matchAll(/<a[^>]*href="(http:\/\/ufcstats\.com\/fighter-details\/[^"]*)"[^>]*>\s*([^<]+?)\s*<\/a>/g)]
      if (links.length < 2) continue
      const f1 = links[0][2].trim(), f2 = links[1][2].trim()

      const flagMatch = row.match(/<i class="b-flag__text">(win|loss|draw|nc)/i)
      const flag = flagMatch?.[1]?.toLowerCase()

      const pTexts = [...row.matchAll(/<p class="b-fight-details__table-text"[^>]*>([\s\S]*?)<\/p>/g)]
        .map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean)
      let method_detail = '', round: number | null = null, time = ''
      for (let i = 0; i < pTexts.length; i++) {
        if (pTexts[i].match(/^\d:\d{2}$/)) {
          time = pTexts[i]
          if (i > 0 && pTexts[i - 1].match(/^\d+$/)) round = parseInt(pTexts[i - 1])
          if (i > 1) method_detail = pTexts[i - 2]
          break
        }
      }
      const method = deriveMethod(method_detail)
      const wcMatch = row.match(/((?:Women.s\s+)?(?:Light\s+)?(?:Heavy|Middle|Welter|Feather|Bantam|Fly|Super\s+Heavy|Open|Catch)\s*weight|Lightweight)\s*<br/i)

      const { data: f1d } = await sb.from('fighters').select('id').eq('name', f1).single()
      const { data: f2d } = await sb.from('fighters').select('id').eq('name', f2).single()
      if (!f1d || !f2d) continue

      // Find fight with null result/winner (either ordering)
      let { data: fight } = await sb.from('fights').select('id, result, winner_id')
        .eq('event_id', evData.id).eq('fighter1_id', f1d.id).eq('fighter2_id', f2d.id)
        .is('winner_id', null).single()
      if (!fight) {
        const res = await sb.from('fights').select('id, result, winner_id')
          .eq('event_id', evData.id).eq('fighter1_id', f2d.id).eq('fighter2_id', f1d.id)
          .is('winner_id', null).single()
        fight = res.data
      }

      if (fight) {
        let winnerId: string | null = null
        let result: string | null = null
        if (flag === 'win') { winnerId = f1d.id; result = 'Win' }
        else if (flag === 'draw') result = 'Draw'
        else if (flag === 'nc') result = 'No Contest'

        await sb.from('fights').update({
          winner_id: winnerId, result, method: method || null,
          method_detail: method_detail || null, round, time: time || null,
          weight_class: wcMatch?.[1]?.trim() || undefined,
        }).eq('id', fight.id)
        console.log(`    ✅ ${f1} vs ${f2} → ${result} ${method} (${method_detail}) R${round} ${time}`)
      }
    }
  }

  // Step 3: Check for any remaining null-result fights in completed events
  console.log('\nStep 3: Checking for remaining issues...')
  const { data: remaining } = await sb.from('fights')
    .select('id, result, event:events!event_id(name, date, status), fighter1:fighters!fighter1_id(name), fighter2:fighters!fighter2_id(name)')
    .is('winner_id', null)
    .is('result', null)
    .limit(20)

  const completedMissing = remaining?.filter((f: any) => f.event?.status !== 'upcoming')
  if (completedMissing && completedMissing.length > 0) {
    console.log('  Still missing results in completed events:')
    completedMissing.forEach((f: any) => console.log(`    ${f.event?.date} | ${f.fighter1?.name} vs ${f.fighter2?.name}`))
  } else {
    console.log('  ✅ All completed events have results!')
  }

  const { count: total } = await sb.from('fights').select('*', { count: 'exact', head: true })
  console.log(`\n📊 Total fights: ${total}`)
}

main().catch(console.error)
