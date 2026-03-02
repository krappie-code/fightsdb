import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)
async function main() {
  // Check for Scotland/Wales too
  for (const [bad, flag, name] of [
    ['🇪🇳 England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'England'],
    ['🇸🇨 Scotland', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Scotland'],
    ['🇼🇦 Wales', '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'Wales'],
  ]) {
    const { data, error } = await supabase
      .from('fighters')
      .update({ birth_location: `${flag} ${name}` })
      .eq('birth_location', bad)
      .select('name')
    if (data?.length) console.log(`Fixed ${data.length} ${name} fighters:`, data.map(f => f.name).join(', '))
  }
}
main()
