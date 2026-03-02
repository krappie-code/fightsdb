import Link from 'next/link'

export function Navbar() {
  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black tracking-tight text-white">
          Fights<span className="text-red-500">DB</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/events" className="text-zinc-300 hover:text-white transition-colors font-medium">
            Events
          </Link>
          <Link href="/fighters" className="text-zinc-300 hover:text-white transition-colors font-medium">
            Fighters
          </Link>
          <Link href="/championships" className="text-zinc-300 hover:text-white transition-colors font-medium">
            🥇 Titles
          </Link>
          <Link href="/search" className="text-zinc-300 hover:text-white transition-colors font-medium">
            🔍 Search
          </Link>
        </div>
      </div>
    </nav>
  )
}
