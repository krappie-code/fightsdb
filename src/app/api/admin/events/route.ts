import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const filter = searchParams.get('filter') || 'all'
  const page = parseInt(searchParams.get('page') || '0')
  const limit = 50

  let query = getSupabase().from('events').select('*', { count: 'exact' }).order('date', { ascending: false })

  if (search) query = query.ilike('name', `%${search}%`)
  if (filter === 'no-poster') query = query.is('poster_url', null)

  const { data, count, error } = await query.range(page * limit, (page + 1) * limit - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, count, page, limit })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data, error } = await getSupabase()
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
