'use client'

import Link from 'next/link'

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-3xl font-black text-white mb-2">⚙️ Admin Dashboard</h1>
      <p className="text-zinc-400 mb-8">Manage fighters, events, and fights data.</p>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/fighters" className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-red-500/50 transition-colors">
          <h2 className="text-xl font-bold text-white mb-2">🥊 Fighters</h2>
          <p className="text-zinc-400 text-sm">Edit fighter names, images, records, countries</p>
        </Link>

        <Link href="/admin/events" className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-red-500/50 transition-colors">
          <h2 className="text-xl font-bold text-white mb-2">📅 Events</h2>
          <p className="text-zinc-400 text-sm">Edit event details, add poster images</p>
        </Link>

        <Link href="/admin/fights" className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-red-500/50 transition-colors">
          <h2 className="text-xl font-bold text-white mb-2">⚔️ Fights</h2>
          <p className="text-zinc-400 text-sm">Edit fight results, methods, title fights</p>
        </Link>
      </div>
    </div>
  )
}
