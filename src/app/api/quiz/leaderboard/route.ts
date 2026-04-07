import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/quiz/leaderboard?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('quiz_leaderboard')
      .select('*')
      .eq('quiz_date', date)
      .order('score', { ascending: false })
      .order('total_time', { ascending: true })
      .limit(100)
    
    if (error) {
      console.error('Error fetching leaderboard:', error)
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
    }
    
    return NextResponse.json({ leaderboard: data || [] })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/quiz/leaderboard
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, score, maxScore, percentage, totalTime, quizDate } = body
    
    // Validate required fields
    if (!score && score !== 0) {
      return NextResponse.json({ error: 'Score is required' }, { status: 400 })
    }
    
    const entryData = {
      username: username || 'Anonymous',
      score,
      max_score: maxScore,
      percentage,
      total_time: totalTime,
      quiz_date: quizDate || new Date().toISOString().split('T')[0],
      completed_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('quiz_leaderboard')
      .insert(entryData)
      .select()
      .single()
    
    if (error) {
      console.error('Error saving to leaderboard:', error)
      return NextResponse.json({ error: 'Failed to save score' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, entry: data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}