import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/quiz/leaderboard?date=YYYY-MM-DD&page=1&limit=50&findUser=true&userScore=8&userTime=120
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Leaderboard API called')
    console.log('🔗 Supabase URL:', supabaseUrl)
    console.log('🔑 Has API Key:', !!supabaseKey)
    
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const findUser = searchParams.get('findUser') === 'true'
    const userScore = searchParams.get('userScore')
    const userTime = searchParams.get('userTime')
    
    console.log('📅 Fetching leaderboard for date:', date, 'page:', page, 'limit:', limit)
    
    // If finding user position, get their rank first
    if (findUser && userScore && userTime) {
      const userRankQuery = await supabase
        .rpc('get_user_rank', {
          target_date: date,
          target_score: parseInt(userScore),
          target_time: parseInt(userTime)
        })
      
      if (userRankQuery.data) {
        const userRank = userRankQuery.data
        const userPage = Math.ceil(userRank / limit)
        console.log(`👤 User rank: ${userRank}, jumping to page: ${userPage}`)
        
        // Get the page containing the user
        const offset = (userPage - 1) * limit
        const { data, error } = await supabase
          .from('quiz_leaderboard')
          .select('*')
          .eq('quiz_date', date)
          .order('score', { ascending: false })
          .order('total_time', { ascending: true })
          .range(offset, offset + limit - 1)
        
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
        
        return NextResponse.json({ 
          leaderboard: mappedData, 
          currentPage: userPage,
          totalCount: userRank + 50, // Rough estimate
          userRank,
          hasMore: true
        })
      }
    }
    
    // Regular pagination
    const offset = (page - 1) * limit
    const { data, error } = await supabase
      .from('quiz_leaderboard')
      .select('*')
      .eq('quiz_date', date)
      .order('score', { ascending: false })
      .order('total_time', { ascending: true })
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('Error fetching leaderboard:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      // Return empty leaderboard instead of error to gracefully fallback
      return NextResponse.json({ leaderboard: [], error: error.message }, { status: 200 })
    }
    
    // Get total count for pagination
    const { count } = await supabase
      .from('quiz_leaderboard')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_date', date)
    
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
    
    return NextResponse.json({ 
      leaderboard: mappedData,
      currentPage: page,
      totalCount: count || 0,
      hasMore: (page * limit) < (count || 0)
    })
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