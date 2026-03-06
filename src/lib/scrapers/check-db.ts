import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
async function main() {
  const { count: total } = await sb.from('fighters').select('*', { count: 'exact', head: true })
  const { count: noCountry } = await sb.from('fighters').select('*', { count: 'exact', head: true }).is('country', null)
  const { count: noImage } = await sb.from('fighters').select('*', { count: 'exact', head: true }).is('image_url', null)
  const { count: noRecord } = await sb.from('fighters').select('*', { count: 'exact', head: true }).is('wins', null)
  const { count: events } = await sb.from('events').select('*', { count: 'exact', head: true })
  const { count: fights } = await sb.from('fights').select('*', { count: 'exact', head: true })
  console.log('Events:', events, '| Fights:', fights, '| Fighters:', total)
  console.log('Missing country:', noCountry)
  console.log('Missing image:', noImage)
  console.log('Missing W-L-D:', noRecord)
}
main()
