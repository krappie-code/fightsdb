import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/quiz/leaderboard?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Leaderboard API called')
    console.log('🔗 Supabase URL:', supabaseUrl)
    console.log('🔑 Has API Key:', !!supabaseKey)
    
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    console.log('📅 Fetching leaderboard for date:', date)
    
    const { data, error } = await supabase
      .from('quiz_leaderboard')
      .select('*')
      .eq('quiz_date', date)
      .order('score', { ascending: false })
      .order('total_time', { ascending: true })
      .limit(100)
    
    if (error) {
      console.error('Error fetching leaderboard:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      // Return empty leaderboard instead of error to gracefully fallback
      return NextResponse.json({ leaderboard: [], error: error.message }, { status: 200 })
    }
    
    // Map database fields to frontend expectations
    const mappedData = (data || []).map((entry: any) => ({
      id: entry.id,
      username: entry.username,
      score: entry.score,
      maxScore: entry.max_score,
      percentage: entry.percentage,
      totalTime: entry.total_time,
      quizDate: entry.quiz_date,
      completedAt: entry.completed_at
    }))
    
    return NextResponse.json({ leaderboard: mappedData })
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
      console.error('Error details:', JSON.stringify(error, null, 2))
      console.error('Entry data:', JSON.stringify(entryData, null, 2))
      return NextResponse.json({ 
        error: 'Failed to save score', 
        details: error.message,
        fallback: 'Score will be saved locally instead'
      }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, entry: data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}