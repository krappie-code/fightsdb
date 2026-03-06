import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// Known Road to UFC / TUF international / regional finale fighters
// These are NOT real UFC title fights — belt.png on UFC Stats means tournament final
const FALSE_TITLE_FIGHTERS = [
  // Road to UFC / TUF regional finales
  'Keiichiro Nakamura', 'Sebastian Szalay',
  'Rony Jason', 'Godofredo Pepey',
  'Norman Parke', 'Colin Fletcher',
  'Leonardo Santos', 'William Macario',
  'Zhang Lipeng', 'Sai Wang',
  'Chad Laprise', 'Olivier Aubin-Mercier',
  'Elias Theodorou', 'Sheldon Westcott',
  'Warlley Alves', 'Marcio Alexandre Junior',
  'Antonio Carlos Junior', 'Vitor Miranda',
  'Guangyou Ning', 'Jianping Yang',
  'Enrique Barzola', 'Horacio Gutierrez',
  'Erick Montano', 'Enrique Marin',
  'Martin Bravo', 'Claudio Puelles',
  'HyunSung Park', 'SeungGuk Choi',
  'Rinya Nakamura', 'Toshiomi Kazama',
  'JeongYeong Lee', 'Yizha',
  'Anshul Jubli', 'Jeka Saragih',
  'Mairon Santos', 'Kaan Ofli',
  'Ryan Loder', 'Robert Valentin',
  'Shi Ming', 'Feng Xiaocan',
  'DongHun Choi', 'Kiru Sahota',
  'SuYoung You', 'Baergeng Jieleyisi',
  'Daniil Donchenko', 'Rodrigo Sezinando',
  'Reginaldo Vieira', 'Dileno Lopes',
  'Glaico Franca', 'Fernando Bruno',
  'Alejandro Perez', 'Jose Quinonez',
  'Yair Rodriguez', 'Leonardo Morales',
  'Cezar Ferreira', 'Sergio Moraes',
]

async function main() {
  const { data: all } = await sb.from('fights')
    .select('id, weight_class, fighter1:fighters!fighter1_id(name), fighter2:fighters!fighter2_id(name), event:events!event_id(name, date)')
    .eq('title_fight', true)
    .limit(500)

  const removeIds: string[] = []

  for (const f of all || []) {
    const f1 = (f as any).fighter1?.name || ''
    const f2 = (f as any).fighter2?.name || ''
    
    const isFalse = FALSE_TITLE_FIGHTERS.some(name => {
      const lastName = name.split(' ').pop()!
      return f1.includes(lastName) && FALSE_TITLE_FIGHTERS.some(n => f1.includes(n.split(' ').pop()!)) ||
             f2.includes(lastName) && FALSE_TITLE_FIGHTERS.some(n => f2.includes(n.split(' ').pop()!))
    })

    // Better check: match full names
    const isFalse2 = FALSE_TITLE_FIGHTERS.some(name => f1 === name || f2 === name)
    
    if (isFalse2) {
      removeIds.push(f.id)
      console.log(`  🔄 REMOVE: ${f1} vs ${f2} | ${(f as any).event?.name}`)
    }
  }

  console.log(`\nWill remove ${removeIds.length} false title fights`)

  if (removeIds.length > 0) {
    for (let i = 0; i < removeIds.length; i += 50) {
      const batch = removeIds.slice(i, i + 50)
      const { error } = await sb.from('fights')
        .update({ title_fight: false, title_fight_type: null })
        .in('id', batch)
      if (error) console.error('Error:', error)
    }
    console.log(`✅ Removed ${removeIds.length} false title fights`)
  }

  const { count } = await sb.from('fights').select('*', { count: 'exact', head: true }).eq('title_fight', true)
  console.log(`Remaining title fights: ${count}`)
}

main()
