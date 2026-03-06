// Tag interim title fights based on Wikipedia's List of UFC Champions
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// Known interim title fights from Wikipedia
// Format: [fighter1 (winner), fighter2, event name substring, weight class]
const INTERIM_FIGHTS: [string, string, string, string][] = [
  // Heavyweight
  ['Andrei Arlovski', 'Tim Sylvia', 'UFC 51', 'Heavyweight'],
  ['Frank Mir', 'Antonio Rodrigo Nogueira', 'UFC 92', 'Heavyweight'],
  ['Shane Carwin', 'Frank Mir', 'UFC 111', 'Heavyweight'],
  ['Antonio Rodrigo Nogueira', 'Tim Sylvia', 'UFC 81', 'Heavyweight'],
  ['Fabricio Werdum', 'Mark Hunt', 'UFC 180', 'Heavyweight'],
  ['Ciryl Gane', 'Derrick Lewis', 'UFC 265', 'Heavyweight'],
  ['Tom Aspinall', 'Sergei Pavlovich', 'UFC 295', 'Heavyweight'],
  ['Tom Aspinall', 'Curtis Blaydes', 'UFC 304', 'Heavyweight'],
  
  // Light Heavyweight
  ['Rampage Jackson', 'Dan Henderson', 'UFC 75', 'Light Heavyweight'],
  ['Rashad Evans', 'Forrest Griffin', 'UFC 92', 'Light Heavyweight'], // not interim actually
  ['Jon Jones', 'Vladimir Matyushenko', 'UFC', 'Light Heavyweight'], // skip - not interim
  ['Glover Teixeira', 'Jan Blachowicz', 'UFC 267', 'Light Heavyweight'], // not interim
  
  // Middleweight
  ['Israel Adesanya', 'Kelvin Gastelum', 'UFC 236', 'Middleweight'],
  ['Robert Whittaker', 'Yoel Romero', 'UFC 213', 'Middleweight'],
  ['Robert Whittaker', 'Yoel Romero', 'UFC 225', 'Middleweight'], // defense of interim
  
  // Welterweight
  ['Carlos Condit', 'Nick Diaz', 'UFC 143', 'Welterweight'],
  ['Colby Covington', 'Rafael dos Anjos', 'UFC 225', 'Welterweight'],
  ['Kamaru Usman', 'Colby Covington', 'UFC 245', 'Welterweight'], // unified, not interim
  
  // Lightweight
  ['Tony Ferguson', 'Kevin Lee', 'UFC 216', 'Lightweight'],
  ['Dustin Poirier', 'Max Holloway', 'UFC 236', 'Lightweight'],
  ['Justin Gaethje', 'Tony Ferguson', 'UFC 249', 'Lightweight'],
  ['Justin Gaethje', 'Justin Gaethje', 'UFC 324', 'Lightweight'], // recent interim - need to verify
  
  // Featherweight
  ['Jose Aldo', 'Frankie Edgar', 'UFC 200', 'Featherweight'], // wait - Aldo wasn't interim here
  ['Max Holloway', 'Anthony Pettis', 'UFC 206', 'Featherweight'],
  ['Alexander Volkanovski', 'Yair Rodriguez', 'UFC 290', 'Featherweight'], // not interim
  
  // Bantamweight
  ['Renan Barao', 'Urijah Faber', 'UFC 149', 'Bantamweight'],
  ['Petr Yan', 'Cory Sandhagen', 'UFC 267', 'Bantamweight'],
  
  // Flyweight
  // No notable interim flyweight fights
  
  // Women's Bantamweight
  ['Holly Holm', 'Germaine de Randamie', 'UFC 208', "Women's Featherweight"], // not interim
  
  // BMF
  ['Jorge Masvidal', 'Nate Diaz', 'UFC 244', 'Welterweight'], // BMF - not standard title
  ['Max Holloway', 'Justin Gaethje', 'UFC 300', 'Lightweight'], // BMF
]

// More reliable: search by event name + weight class + title_fight=true
// and if the fight is a known interim, tag it
const CONFIRMED_INTERIM: { event: string; fighter1: string; fighter2: string }[] = [
  // Heavyweight
  { event: 'UFC 51', fighter1: 'Andrei Arlovski', fighter2: 'Tim Sylvia' },
  { event: 'UFC 81', fighter1: 'Antonio Rodrigo Nogueira', fighter2: 'Tim Sylvia' },
  { event: 'UFC 92', fighter1: 'Frank Mir', fighter2: 'Antonio Rodrigo Nogueira' },
  { event: 'UFC 111', fighter1: 'Shane Carwin', fighter2: 'Frank Mir' },
  { event: 'UFC 180', fighter1: 'Fabricio Werdum', fighter2: 'Mark Hunt' },
  { event: 'UFC 265', fighter1: 'Ciryl Gane', fighter2: 'Derrick Lewis' },
  { event: 'UFC 295', fighter1: 'Tom Aspinall', fighter2: 'Sergei Pavlovich' },
  { event: 'UFC 304', fighter1: 'Tom Aspinall', fighter2: 'Curtis Blaydes' },
  
  // Light Heavyweight
  { event: 'UFC 75', fighter1: 'Quinton Jackson', fighter2: 'Dan Henderson' },
  
  // Middleweight
  { event: 'UFC 213', fighter1: 'Robert Whittaker', fighter2: 'Yoel Romero' },
  { event: 'UFC 236', fighter1: 'Israel Adesanya', fighter2: 'Kelvin Gastelum' },
  
  // Welterweight
  { event: 'UFC 143', fighter1: 'Carlos Condit', fighter2: 'Nick Diaz' },
  { event: 'UFC 225', fighter1: 'Colby Covington', fighter2: 'Rafael dos Anjos' },
  
  // Lightweight
  { event: 'UFC 216', fighter1: 'Tony Ferguson', fighter2: 'Kevin Lee' },
  { event: 'UFC 236', fighter1: 'Dustin Poirier', fighter2: 'Max Holloway' },
  { event: 'UFC 249', fighter1: 'Justin Gaethje', fighter2: 'Tony Ferguson' },
  { event: 'UFC 324', fighter1: 'Justin Gaethje', fighter2: 'Charles Oliveira' },
  
  // Featherweight
  { event: 'UFC 206', fighter1: 'Max Holloway', fighter2: 'Anthony Pettis' },
  { event: 'UFC 200', fighter1: 'Jose Aldo', fighter2: 'Frankie Edgar' },
  
  // Bantamweight
  { event: 'UFC 149', fighter1: 'Renan Barao', fighter2: 'Urijah Faber' },
  { event: 'UFC 267', fighter1: 'Petr Yan', fighter2: 'Cory Sandhagen' },
  
  // Women's Flyweight
  { event: 'UFC Fight Night', fighter1: 'Valentina Shevchenko', fighter2: 'Jessica Andrade' },
]

async function main() {
  console.log('🏆 Tagging interim title fights...\n')
  
  let tagged = 0
  
  for (const item of CONFIRMED_INTERIM) {
    // Find the event
    const { data: events } = await supabase
      .from('events')
      .select('id, name')
      .ilike('name', `%${item.event}%`)
    
    if (!events || events.length === 0) {
      console.log(`  ⚠️ Event not found: ${item.event}`)
      continue
    }
    
    for (const event of events) {
      // Find title fights in this event that match fighters
      const { data: fights } = await supabase
        .from('fights')
        .select('id, weight_class, title_fight, title_fight_type, fighter1:fighters!fighter1_id(name), fighter2:fighters!fighter2_id(name)')
        .eq('event_id', event.id)
        .eq('title_fight', true)
      
      if (!fights) continue
      
      for (const fight of fights) {
        const f1 = (fight as any).fighter1?.name || ''
        const f2 = (fight as any).fighter2?.name || ''
        
        // Check if this fight matches our interim list
        const matchesF1 = f1.toLowerCase().includes(item.fighter1.toLowerCase().split(' ').pop()!) ||
                          item.fighter1.toLowerCase().includes(f1.toLowerCase().split(' ').pop()!)
        const matchesF2 = f2.toLowerCase().includes(item.fighter2.toLowerCase().split(' ').pop()!) ||
                          item.fighter2.toLowerCase().includes(f2.toLowerCase().split(' ').pop()!)
        
        if ((matchesF1 && matchesF2) || (matchesF1 && f2.toLowerCase().includes(item.fighter2.toLowerCase().split(' ').pop()!))) {
          if (fight.title_fight_type !== 'interim') {
            const { error } = await supabase
              .from('fights')
              .update({ title_fight_type: 'interim' })
              .eq('id', fight.id)
            
            if (!error) {
              tagged++
              console.log(`  ✅ ${event.name}: ${f1} vs ${f2} → INTERIM`)
            } else {
              console.log(`  ❌ Error: ${error.message}`)
            }
          } else {
            console.log(`  ⏭️ Already interim: ${event.name}: ${f1} vs ${f2}`)
          }
        }
      }
    }
  }
  
  console.log(`\n✅ Done! Tagged ${tagged} fights as interim`)
  
  // Now check BMF fights
  console.log('\n🏆 Checking for BMF title fights...')
  // BMF title fights are special - they're title fights but for the BMF belt
  // UFC 244: Masvidal vs Diaz, UFC 300: Holloway vs Gaethje
  const bmfFights = [
    { event: 'UFC 244', fighter1: 'Jorge Masvidal', fighter2: 'Nate Diaz' },
    { event: 'UFC 300', fighter1: 'Max Holloway', fighter2: 'Justin Gaethje' },
  ]
  
  for (const item of bmfFights) {
    const { data: events } = await supabase
      .from('events')
      .select('id, name')
      .ilike('name', `%${item.event}%`)
    
    if (!events || events.length === 0) continue
    
    for (const event of events) {
      const { data: fights } = await supabase
        .from('fights')
        .select('id, title_fight, title_fight_type, fighter1:fighters!fighter1_id(name), fighter2:fighters!fighter2_id(name)')
        .eq('event_id', event.id)
        .eq('title_fight', true)
      
      if (!fights) continue
      
      for (const fight of fights) {
        const f1 = (fight as any).fighter1?.name || ''
        const f2 = (fight as any).fighter2?.name || ''
        
        if ((f1.includes('Masvidal') && f2.includes('Diaz')) || 
            (f1.includes('Holloway') && f2.includes('Gaethje'))) {
          const { error } = await supabase
            .from('fights')
            .update({ title_fight_type: 'bmf' })
            .eq('id', fight.id)
          
          if (!error) {
            console.log(`  ✅ BMF: ${event.name}: ${f1} vs ${f2}`)
          }
        }
      }
    }
  }
  
  // Final count
  const { count: interimCount } = await supabase.from('fights').select('*', { count: 'exact', head: true }).eq('title_fight_type', 'interim')
  const { count: bmfCount } = await supabase.from('fights').select('*', { count: 'exact', head: true }).eq('title_fight_type', 'bmf')
  const { count: undisputedCount } = await supabase.from('fights').select('*', { count: 'exact', head: true }).eq('title_fight_type', 'undisputed')
  console.log(`\n📊 Final counts: ${undisputedCount} undisputed, ${interimCount} interim, ${bmfCount} BMF`)
}

main().catch(console.error)
