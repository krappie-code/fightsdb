import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            The Ultimate UFC Database
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Comprehensive UFC fight database with ratings, spoiler protection, and smart filtering. 
            Discover fights, rate performances, and test your MMA knowledge!
          </p>
        </div>

        {/* Recent Events Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Recent Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Recent Event Cards */}
            <div className="bg-slate-800 border border-gray-700 rounded-lg p-6 hover:bg-slate-750 transition-colors">
              <div className="text-sm text-gray-400 mb-2">April 5, 2026</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                UFC Fight Night: Moicano vs Duncan
              </h3>
              <p className="text-gray-300 text-sm mb-4">Las Vegas, Nevada</p>
              <Link 
                href="/events" 
                className="text-red-400 hover:text-red-300 text-sm font-medium"
              >
                View Fight Card →
              </Link>
            </div>
            
            <div className="bg-slate-800 border border-gray-700 rounded-lg p-6 hover:bg-slate-750 transition-colors">
              <div className="text-sm text-gray-400 mb-2">March 28, 2026</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                UFC Fight Night: Adesanya vs Pyfer
              </h3>
              <p className="text-gray-300 text-sm mb-4">Seattle, Washington</p>
              <Link 
                href="/events" 
                className="text-red-400 hover:text-red-300 text-sm font-medium"
              >
                View Fight Card →
              </Link>
            </div>

            <div className="bg-slate-800 border border-gray-700 rounded-lg p-6 hover:bg-slate-750 transition-colors">
              <div className="text-sm text-gray-400 mb-2">March 21, 2026</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                UFC Fight Night: Evloev vs Murphy
              </h3>
              <p className="text-gray-300 text-sm mb-4">London, England</p>
              <Link 
                href="/events" 
                className="text-red-400 hover:text-red-300 text-sm font-medium"
              >
                View Fight Card →
              </Link>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link 
              href="/events" 
              className="inline-block bg-slate-700 text-white px-6 py-3 rounded-lg hover:bg-slate-600 transition-colors"
            >
              View All Recent Events
            </Link>
          </div>
        </div>

        {/* Upcoming Events Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-800 border border-gray-700 rounded-lg p-6 hover:bg-slate-750 transition-colors">
              <div className="text-sm text-green-400 mb-2 font-medium">April 11, 2026</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                UFC 327: Prochazka vs Ulberg
              </h3>
              <p className="text-gray-300 text-sm mb-4">Miami, Florida</p>
              <div className="text-xs text-gray-400">4 days away</div>
            </div>

            <div className="bg-slate-800 border border-gray-700 rounded-lg p-6 hover:bg-slate-750 transition-colors">
              <div className="text-sm text-green-400 mb-2 font-medium">April 18, 2026</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                UFC Fight Night: Burns vs Malott
              </h3>
              <p className="text-gray-300 text-sm mb-4">Winnipeg, Manitoba</p>
              <div className="text-xs text-gray-400">11 days away</div>
            </div>

            <div className="bg-slate-800 border border-gray-700 rounded-lg p-6 hover:bg-slate-750 transition-colors">
              <div className="text-sm text-green-400 mb-2 font-medium">April 25, 2026</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                UFC Fight Night: Sterling vs Zalal
              </h3>
              <p className="text-gray-300 text-sm mb-4">Las Vegas, Nevada</p>
              <div className="text-xs text-gray-400">18 days away</div>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link 
              href="/upcoming" 
              className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
            >
              View All Upcoming Events
            </Link>
          </div>
        </div>

        {/* Today's Quiz CTA */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">🧠</div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Today's UFC Quiz is Ready!
          </h2>
          <p className="text-lg text-red-100 mb-8 max-w-2xl mx-auto">
            Test your knowledge with 10 questions covering fights, fighters, and events. 
            Can you achieve Encyclopedia status?
          </p>
          <Link 
            href="/quiz/daily"
            className="inline-block bg-white text-red-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
          >
            Start Today's Quiz 🥊
          </Link>
          <div className="mt-4 text-sm text-red-200">
            New questions daily • Spoiler-free • Challenge friends
          </div>
        </div>
      </div>
    </main>
  )
}