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

  // Get leaderboard for specific date
  static async getLeaderboard(date?: string): Promise<LeaderboardEntry[]> {
    try {
      const queryDate = date || new Date().toISOString().split('T')[0]
      console.log(`📊 Fetching leaderboard for ${queryDate}...`)
      
      const response = await fetch(`/api/quiz/leaderboard?date=${queryDate}`)
      const result = await response.json()
      
      if (!response.ok) {
        console.warn('Server leaderboard unavailable:', result.error || response.statusText)
        console.log('Using local storage leaderboard...')
        // Fallback to localStorage if server fails
        return this.getLeaderboardFromLocalStorage(date)
      }

      const entries = result.leaderboard || []
      console.log(`✅ Loaded ${entries.length} entries from server leaderboard`)
      
      if (entries.length === 0) {
        console.log('📝 No scores yet today - checking localStorage as backup...')
        const localEntries = this.getLeaderboardFromLocalStorage(date)
        if (localEntries.length > 0) {
          console.log(`📱 Found ${localEntries.length} local entries`)
          return localEntries
        }
      }
      
      return entries
    } catch (error) {
      console.error('Error fetching server leaderboard:', error)
      console.log('Using local storage leaderboard...')
      
      // Fallback to localStorage if server fails
      return this.getLeaderboardFromLocalStorage(date)
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