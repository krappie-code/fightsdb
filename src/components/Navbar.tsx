'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/upcoming', label: 'Upcoming' },
  { href: '/events', label: 'Events' },
  { href: '/fights', label: 'Fights' },
  { href: '/fighters', label: 'Fighters' },
  { href: '/championships', label: 'Titles' },
  { href: '/quiz/daily', label: 'Daily Quiz' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black tracking-tight text-white flex-shrink-0">
          Fights<span className="text-red-500">DB</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors font-medium ${
                pathname === item.href
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          {open ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {open && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-900">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-3 transition-colors border-b border-zinc-800/50 ${
                pathname === item.href
                  ? 'text-white bg-zinc-800/50'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
