import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <nav className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-red-600">FightsDB</h1>
            <div className="flex items-center gap-6">
              <Link href="/fights" className="text-gray-600 hover:text-gray-900">
                Fights
              </Link>
              <Link href="/quiz/daily" className="text-gray-600 hover:text-gray-900">
                Daily Quiz
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-gray-900">
                About
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            The Ultimate UFC Database
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Comprehensive UFC fight database with ratings, spoiler protection, and smart filtering. 
            Discover fights, rate performances, and test your MMA knowledge!
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Fight Database */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🥊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Fight Database
              </h3>
              <p className="text-gray-600 mb-6">
                Browse thousands of UFC fights with spoiler protection, detailed stats, and community ratings.
              </p>
              <Link 
                href="/fights" 
                className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Browse Fights
              </Link>
            </div>

            {/* Daily Quiz */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Daily Quiz
              </h3>
              <p className="text-gray-600 mb-6">
                Test your UFC knowledge with our daily quiz. New questions every day across all difficulty levels!
              </p>
              <Link 
                href="/quiz/daily" 
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Take Today's Quiz
              </Link>
            </div>

            {/* Smart Filtering */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Smart Discovery
              </h3>
              <p className="text-gray-600 mb-6">
                Advanced filtering by weight class, finish type, rating, and more. Find your next favorite fight!
              </p>
              <Link 
                href="/search" 
                className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Discover Fights
              </Link>
            </div>
          </div>

          {/* Quiz CTA */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-8 rounded-xl mb-8">
            <h3 className="text-2xl font-bold mb-4">📅 Today's UFC Quiz is Ready!</h3>
            <p className="text-lg mb-6 text-red-100">
              Test your knowledge with 10 questions covering fights, fighters, and events. 
              Can you achieve Encyclopedia status?
            </p>
            <Link 
              href="/quiz/daily"
              className="inline-block bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Start Quiz 🧠
            </Link>
          </div>

          {/* Features List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-3">🙈 Spoiler Protection</h4>
              <p className="text-gray-600">
                Browse fights without spoilers. Results hidden until you choose to reveal them.
              </p>
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-3">⭐ Community Ratings</h4>
              <p className="text-gray-600">
                Rate fights and see community sentiment. Find the most exciting matchups.
              </p>
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-3">📺 Highlight Integration</h4>
              <p className="text-gray-600">
                Watch official UFC highlights and clips directly from fight cards.
              </p>
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-3">🎯 Daily Challenges</h4>
              <p className="text-gray-600">
                Fresh quiz questions every day. Share your scores and challenge friends!
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400 mb-4">
            © 2026 FightsDB. The ultimate destination for UFC fight discovery and trivia.
          </p>
          <div className="space-x-6">
            <Link href="/privacy" className="text-gray-400 hover:text-white text-sm">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white text-sm">
              Terms
            </Link>
            <Link href="/contact" className="text-gray-400 hover:text-white text-sm">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}