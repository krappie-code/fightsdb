'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SearchBar } from '@/components/SearchBar'
import { FighterCard } from '@/components/FighterCard'
import { Suspense } from 'react'

function SearchContent() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q.trim()) { setResults([]); return }
    const search = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('fighters')
        .select('*')
        .textSearch('fts', q.trim())
        .limit(50)
      setResults(data ?? [])
      setLoading(false)
    }
    search()
  }, [q])

  return (
    <div>
      <h1 className="text-3xl font-black mb-6 text-red-500">Search Fighters</h1>
      <SearchBar defaultValue={q} />
      <div className="mt-6">
        {loading && <p className="text-zinc-500">Searching...</p>}
        {!loading && q && results.length === 0 && (
          <p className="text-zinc-500">No fighters found for &ldquo;{q}&rdquo;</p>
        )}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {results.map(f => (
            <FighterCard key={f.id} fighter={f} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="text-zinc-500">Loading...</p>}>
      <SearchContent />
    </Suspense>
  )
}
