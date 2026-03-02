import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('event_id') || ''
  const page = parseInt(searchParams.get('page') || '0')
  const limit = 50

  let query = supabase
    .from('fights')
    .select('*, fighter1:fighters!fighter1_id(id,name), fighter2:fighters!fighter2_id(id,name), event:events(id,name,date)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (eventId) query = query.eq('event_id', eventId)

  const { data, count, error } = await query.range(page * limit, (page + 1) * limit - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, count, page, limit })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('fights')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
