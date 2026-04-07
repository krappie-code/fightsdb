// Quiz Leaderboard API utilities

export interface LeaderboardEntry {
  id?: string
  username: string
  score: number
  maxScore: number
  percentage: number
  totalTime: number
  quizDate: string
  completedAt: string
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[]
  currentPage: number
  totalCount: number
  hasMore: boolean
  userRank?: number
}

export interface UserScore {
  score: number
  totalTime: number
}

export class QuizLeaderboardAPI {
  
  // Save score to server leaderboard
  static async saveScore(entry: Omit<LeaderboardEntry, 'id' | 'completedAt'>): Promise<boolean> {
    try {
      const response = await fetch('/api/quiz/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: entry.username,
          score: entry.score,
          maxScore: entry.maxScore,
          percentage: entry.percentage,
          totalTime: entry.totalTime,
          quizDate: entry.quizDate
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        console.warn('Server leaderboard failed:', result.error || response.statusText)
        console.log('Falling back to local storage...')
        // Fallback to localStorage if server fails
        this.saveScoreToLocalStorage(entry)
        return false
      }

      console.log('Score saved to server leaderboard:', result)
      return true
    } catch (error) {
      console.error('Error saving score to leaderboard:', error)
      console.log('Falling back to local storage...')
      
      // Fallback to localStorage if server fails
      this.saveScoreToLocalStorage(entry)
      return false
    }
  }

  // Get leaderboard for specific date with pagination
  static async getLeaderboard(
    date?: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<LeaderboardResponse> {
    try {
      const queryDate = date || new Date().toISOString().split('T')[0]
      console.log(`📊 Fetching leaderboard for ${queryDate}, page ${page}...`)
      
      const params = new URLSearchParams({
        date: queryDate,
        page: page.toString(),
        limit: limit.toString()
      })
      
      const response = await fetch(`/api/quiz/leaderboard?${params}`)
      const result = await response.json()
      
      if (!response.ok) {
        console.warn('Server leaderboard unavailable:', result.error || response.statusText)
        console.log('Using local storage leaderboard...')
        // Fallback to localStorage if server fails
        const localEntries = this.getLeaderboardFromLocalStorage(date)
        return {
          leaderboard: localEntries,
          currentPage: 1,
          totalCount: localEntries.length,
          hasMore: false
        }
      }

      console.log(`✅ Loaded ${result.leaderboard?.length || 0} entries from server leaderboard`)
      
      if (result.leaderboard?.length === 0) {
        console.log('📝 No scores yet today - checking localStorage as backup...')
        const localEntries = this.getLeaderboardFromLocalStorage(date)
        if (localEntries.length > 0) {
          console.log(`📱 Found ${localEntries.length} local entries`)
          return {
            leaderboard: localEntries,
            currentPage: 1,
            totalCount: localEntries.length,
            hasMore: false
          }
        }
      }
      
      return {
        leaderboard: result.leaderboard || [],
        currentPage: result.currentPage || page,
        totalCount: result.totalCount || 0,
        hasMore: result.hasMore || false,
        userRank: result.userRank
      }
    } catch (error) {
      console.error('Error fetching server leaderboard:', error)
      console.log('Using local storage leaderboard...')
      
      // Fallback to localStorage if server fails
      const localEntries = this.getLeaderboardFromLocalStorage(date)
      return {
        leaderboard: localEntries,
        currentPage: 1,
        totalCount: localEntries.length,
        hasMore: false
      }
    }
  }

  // Find user's position in leaderboard
  static async findUserInLeaderboard(
    userScore: UserScore,
    date?: string
  ): Promise<LeaderboardResponse> {
    try {
      const queryDate = date || new Date().toISOString().split('T')[0]
      console.log(`👤 Finding user position: score=${userScore.score}, time=${userScore.totalTime}`)
      
      const params = new URLSearchParams({
        date: queryDate,
        findUser: 'true',
        userScore: userScore.score.toString(),
        userTime: userScore.totalTime.toString(),
        limit: '50'
      })
      
      const response = await fetch(`/api/quiz/leaderboard?${params}`)
      const result = await response.json()
      
      if (!response.ok) {
        console.warn('Cannot find user position, falling back to regular leaderboard')
        return this.getLeaderboard(date)
      }

      console.log(`👤 User found at rank ${result.userRank}`)
      return {
        leaderboard: result.leaderboard || [],
        currentPage: result.currentPage || 1,
        totalCount: result.totalCount || 0,
        hasMore: result.hasMore || false,
        userRank: result.userRank
      }
    } catch (error) {
      console.error('Error finding user position:', error)
      // Fallback to regular leaderboard
      return this.getLeaderboard(date)
    }
  }

  // Check if user has completed today's quiz (localStorage for now)
  static hasCompletedToday(date?: string): boolean {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0]
      const completedQuizzes = JSON.parse(localStorage.getItem('completed_quizzes') || '[]')
      return completedQuizzes.includes(targetDate)
    } catch (error) {
      console.error('Error checking completion status:', error)
      return false
    }
  }

  // Mark quiz as completed for today (localStorage for now)
  static markCompleted(date?: string): void {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0]
      const completedQuizzes = JSON.parse(localStorage.getItem('completed_quizzes') || '[]')
      
      if (!completedQuizzes.includes(targetDate)) {
        completedQuizzes.push(targetDate)
        localStorage.setItem('completed_quizzes', JSON.stringify(completedQuizzes))
      }
    } catch (error) {
      console.error('Error marking quiz as completed:', error)
    }
  }

  // Fallback localStorage methods
  private static saveScoreToLocalStorage(entry: Omit<LeaderboardEntry, 'id' | 'completedAt'>): void {
    try {
      const leaderboardKey = `leaderboard_${entry.quizDate}`
      const leaderboard = JSON.parse(localStorage.getItem(leaderboardKey) || '[]')
      
      const localEntry = {
        ...entry,
        id: `local_${Date.now()}`,
        completedAt: new Date().toISOString()
      }
      
      leaderboard.push(localEntry)
      
      // Sort by score (desc), then by time (asc)
      leaderboard.sort((a: LeaderboardEntry, b: LeaderboardEntry) => {
        if (b.score !== a.score) return b.score - a.score
        return a.totalTime - b.totalTime
      })
      
      // Keep only top 100 entries
      const trimmedLeaderboard = leaderboard.slice(0, 100)
      localStorage.setItem(leaderboardKey, JSON.stringify(trimmedLeaderboard))
    } catch (error) {
      console.error('Error saving to localStorage fallback:', error)
    }
  }

  private static getLeaderboardFromLocalStorage(date?: string): LeaderboardEntry[] {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0]
      const leaderboardKey = `leaderboard_${targetDate}`
      return JSON.parse(localStorage.getItem(leaderboardKey) || '[]')
    } catch (error) {
      console.error('Error reading localStorage fallback:', error)
      return []
    }
  }
}