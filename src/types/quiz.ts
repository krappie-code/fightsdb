// Quiz System Types

export interface QuizQuestion {
  id: string
  fight_id: string
  type: 'winner' | 'method' | 'event' | 'round' | 'year'
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  options: string[]
  correct_answer: string
  explanation?: string
  points: number
}

export interface Quiz {
  id: string // e.g., "daily-2026-03-31"
  title: string
  description: string
  questions: QuizQuestion[]
  created_at: string
  type: 'daily' | 'custom' | 'event'
}

export interface QuizAnswer {
  question_id: string
  selected_answer: string
  is_correct: boolean
  time_taken: number // seconds
}

export interface QuizAttempt {
  quiz_id: string
  user_id?: string // optional for MVP
  score: number
  max_score: number
  percentage: number
  time_taken: number // total seconds
  answers: QuizAnswer[]
  completed_at: string
  streak?: number
}

export interface QuizResult {
  attempt: QuizAttempt
  breakdown: {
    correct: number
    incorrect: number
    easy_correct: number
    medium_correct: number
    hard_correct: number
  }
  performance_rating: 'Novice' | 'Fan' | 'Expert' | 'Encyclopedia'
}

// Question templates for generation
export interface QuestionTemplate {
  type: QuizQuestion['type']
  difficulty: QuizQuestion['difficulty']
  template: string
  generator: (fight: any) => Omit<QuizQuestion, 'id' | 'fight_id'>
}

// Daily quiz configuration
export interface DailyQuizConfig {
  total_questions: number
  difficulty_distribution: {
    easy: number
    medium: number
    hard: number
  }
  points_distribution: {
    easy: number
    medium: number
    hard: number
  }
}

export const DEFAULT_DAILY_CONFIG: DailyQuizConfig = {
  total_questions: 10,
  difficulty_distribution: {
    easy: 7,
    medium: 2,
    hard: 1
  },
  points_distribution: {
    easy: 10,
    medium: 20,
    hard: 30
  }
}

// Share result format
export interface ShareData {
  score: string // "8/10"
  percentage: number
  quiz_title: string
  emoji_rating: string
  url: string
}