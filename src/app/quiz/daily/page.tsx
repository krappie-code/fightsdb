import { QuizInterface } from '@/components/Quiz/QuizInterface'
import { Metadata } from 'next'
import { QuizResult } from '@/types/quiz'

export const metadata: Metadata = {
  title: 'Daily UFC Quiz | FightsDB',
  description: 'Test your UFC knowledge with our daily quiz featuring fights, fighters, and events!',
  openGraph: {
    title: 'Daily UFC Quiz | FightsDB',
    description: 'Test your UFC knowledge with our daily quiz featuring fights, fighters, and events!',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily UFC Quiz | FightsDB',
    description: 'Test your UFC knowledge with our daily quiz featuring fights, fighters, and events!',
  }
}

export default function DailyQuizPage() {
  return (
    <main className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <QuizInterface quizTitle="Daily UFC Quiz" />
      </div>
    </main>
  )
}