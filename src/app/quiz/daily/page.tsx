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
  const handleQuizComplete = (result: QuizResult) => {
    // Could save to local storage or send to analytics
    console.log('Quiz completed:', result)
    
    // Track completion in localStorage for streak tracking (future feature)
    const today = new Date().toISOString().split('T')[0]
    const completedQuizzes = JSON.parse(localStorage.getItem('completed_quizzes') || '[]')
    if (!completedQuizzes.includes(today)) {
      completedQuizzes.push(today)
      localStorage.setItem('completed_quizzes', JSON.stringify(completedQuizzes))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <nav className="flex justify-between items-center">
            <a href="/" className="text-xl font-bold text-red-600">
              FightsDB
            </a>
            <div className="flex items-center gap-6">
              <a href="/fights" className="text-gray-600 hover:text-gray-900">
                Fights
              </a>
              <a href="/quiz/daily" className="text-red-600 font-medium">
                Daily Quiz
              </a>
              <a href="/about" className="text-gray-600 hover:text-gray-900">
                About
              </a>
            </div>
          </nav>
        </div>
      </header>

      {/* Quiz Content */}
      <main className="py-8">
        <QuizInterface 
          quizTitle="Daily UFC Quiz"
          onComplete={handleQuizComplete}
        />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2026 FightsDB. Test your UFC knowledge daily! 🥊
          </p>
          <div className="mt-4 space-x-6">
            <a href="/privacy" className="text-gray-400 hover:text-white text-sm">
              Privacy
            </a>
            <a href="/terms" className="text-gray-400 hover:text-white text-sm">
              Terms
            </a>
            <a href="/contact" className="text-gray-400 hover:text-white text-sm">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}