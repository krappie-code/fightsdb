// Fighter Country Scraper — fetches nationality from ESPN
// Run with: npx tsx src/lib/scrapers/fighter-countries.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
})

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

// Country code to emoji flag
function countryToFlag(code: string): string {
  const upper = code.toUpperCase()
  return String.fromCodePoint(
    ...upper.split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  )
}

// Country abbreviation to full name
const COUNTRY_NAMES: Record<string, string> = {
  USA: 'United States', BRA: 'Brazil', RUS: 'Russia', GBR: 'United Kingdom',
  CAN: 'Canada', MEX: 'Mexico', AUS: 'Australia', NZL: 'New Zealand',
  IRL: 'Ireland', GEO: 'Georgia', KAZ: 'Kazakhstan', UZB: 'Uzbekistan',
  KGZ: 'Kyrgyzstan', CHN: 'China', JPN: 'Japan', KOR: 'South Korea',
  NGA: 'Nigeria', CMR: 'Cameroon', ZAF: 'South Africa', FRA: 'France',
  DEU: 'Germany', NLD: 'Netherlands', SWE: 'Sweden', POL: 'Poland',
  CZE: 'Czech Republic', HRV: 'Croatia', SRB: 'Serbia', BIH: 'Bosnia',
  MDA: 'Moldova', UKR: 'Ukraine', BLR: 'Belarus', ARM: 'Armenia',
  AZE: 'Azerbaijan', TUR: 'Turkey', ISR: 'Israel', PER: 'Peru',
  COL: 'Colombia', ARG: 'Argentina', CHL: 'Chile', ECU: 'Ecuador',
  VEN: 'Venezuela', CUB: 'Cuba', DOM: 'Dominican Republic', PRI: 'Puerto Rico',
  THA: 'Thailand', MYS: 'Malaysia', IDN: 'Indonesia', PHL: 'Philippines',
  IND: 'India', PAK: 'Pakistan', AFG: 'Afghanistan', IRN: 'Iran',
  IRQ: 'Iraq', SAU: 'Saudi Arabia', EGY: 'Egypt', MAR: 'Morocco',
  TUN: 'Tunisia', ITA: 'Italy', ESP: 'Spain', PRT: 'Portugal',
  BEL: 'Belgium', CHE: 'Switzerland', AUT: 'Austria', DNK: 'Denmark',
  NOR: 'Norway', FIN: 'Finland', ISL: 'Iceland', LTU: 'Lithuania',
  LVA: 'Latvia', EST: 'Estonia', ROU: 'Romania', BGR: 'Bulgaria',
  HUN: 'Hungary', SVK: 'Slovakia', MNG: 'Mongolia', MMR: 'Myanmar',
  GHA: 'Ghana', COD: 'DR Congo', ZWE: 'Zimbabwe', TTO: 'Trinidad',
  JAM: 'Jamaica', GUY: 'Guyana', HTI: 'Haiti', SUR: 'Suriname',
}

async function getESPNCountry(fighterName: string): Promise<{ country: string; flag: string; flagUrl: string } | null> {
  try {
    const q = encodeURIComponent(fighterName)
    const url = `https://site.web.api.espn.com/apis/common/v3/search?query=${q}&limit=1&type=player&sport=mma`
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    const data = await res.json()
    const item = data.items?.[0]
    if (!item) return null

    // Verify name match
    const espnLast = item.displayName?.split(' ').pop()?.toLowerCase()
    const searchLast = fighterName.split(' ').pop()?.toLowerCase()
    if (espnLast !== searchLast) return null

    const abbr = item.citizenshipCountry?.abbreviation
    if (!abbr) return null

    // Convert 3-letter to 2-letter for flag emoji
    const flagAlt = item.flag?.alt || COUNTRY_NAMES[abbr] || abbr
    const flagUrl = item.flag?.href || ''

    // Map 3-letter codes to 2-letter for emoji
    const THREE_TO_TWO: Record<string, string> = {
      USA: 'US', BRA: 'BR', RUS: 'RU', GBR: 'GB', CAN: 'CA', MEX: 'MX',
      AUS: 'AU', NZL: 'NZ', IRL: 'IE', GEO: 'GE', KAZ: 'KZ', UZB: 'UZ',
      KGZ: 'KG', CHN: 'CN', JPN: 'JP', KOR: 'KR', NGA: 'NG', CMR: 'CM',
      ZAF: 'ZA', FRA: 'FR', DEU: 'DE', NLD: 'NL', SWE: 'SE', POL: 'PL',
      CZE: 'CZ', HRV: 'HR', SRB: 'RS', BIH: 'BA', MDA: 'MD', UKR: 'UA',
      BLR: 'BY', ARM: 'AM', AZE: 'AZ', TUR: 'TR', ISR: 'IL', PER: 'PE',
      COL: 'CO', ARG: 'AR', CHL: 'CL', ECU: 'EC', VEN: 'VE', CUB: 'CU',
      DOM: 'DO', PRI: 'PR', THA: 'TH', MYS: 'MY', IDN: 'ID', PHL: 'PH',
      IND: 'IN', PAK: 'PK', AFG: 'AF', IRN: 'IR', IRQ: 'IQ', SAU: 'SA',
      EGY: 'EG', MAR: 'MA', TUN: 'TN', ITA: 'IT', ESP: 'ES', PRT: 'PT',
      BEL: 'BE', CHE: 'CH', AUT: 'AT', DNK: 'DK', NOR: 'NO', FIN: 'FI',
      ISL: 'IS', LTU: 'LT', LVA: 'LV', EST: 'EE', ROU: 'RO', BGR: 'BG',
      HUN: 'HU', SVK: 'SK', MNG: 'MN', MMR: 'MM', GHA: 'GH', COD: 'CD',
      ZWE: 'ZW', TTO: 'TT', JAM: 'JM', GUY: 'GY', HTI: 'HT', SUR: 'SR',
    }
    const twoLetter = THREE_TO_TWO[abbr] || abbr.substring(0, 2)
    const flag = countryToFlag(twoLetter)

    return {
      country: flagAlt,
      flag,
      flagUrl,
    }
  } catch {
    return null
  }
}

async function main() {
  console.log('🏳️ Fighter Country Scraper\n')

  const { data: fighters } = await supabase
    .from('fighters')
    .select('id, name, birth_location')
    .is('birth_location', null)
    .order('name')

  if (!fighters?.length) {
    console.log('All fighters already have country data!')
    return
  }

  console.log(`Processing ${fighters.length} fighters...\n`)

  let found = 0

  for (let i = 0; i < fighters.length; i++) {
    const f = fighters[i]
    const result = await getESPNCountry(f.name)

    if (result) {
      await supabase
        .from('fighters')
        .update({ birth_location: `${result.flag} ${result.country}` })
        .eq('id', f.id)
      found++
    }

    await delay(350)

    if ((i + 1) % 50 === 0) {
      console.log(`  [${i + 1}/${fighters.length}] ${found} countries found`)
    }
  }

  console.log(`\n✅ Countries: ${found}/${fighters.length} found`)
}

main().catch(console.error)
