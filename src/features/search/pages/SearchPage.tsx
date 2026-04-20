import { useEffect, useMemo, useState } from 'react'
import { useSearch } from '@tanstack/react-router'
import { mockDb, type Asset } from '#/lib/mockDb'
import { auth } from '#/lib/auth'
import SearchInput from '#/components/public/SearchInput'
import SearchResults from '#/components/public/SearchResults'
import { searchAssets } from '#/features/search/lib/searchEngine'

export default function SearchPage() {
  const search = useSearch({ strict: false }) as { q?: string }
  const query = (search?.q ?? '').toString()

  const [assets, setAssets] = useState<Asset[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setAssets(mockDb.getAssets())
    setIsAuthenticated(auth.isAuthenticated())
  }, [])

  const result = useMemo(() => searchAssets(assets, query), [assets, query])

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
            Search the ThingDaddy Registry
          </h1>
          <p className="mt-2 text-gray-600">
            Look up by GS1 Company Prefix or Thing ID — and register a new
            identifier instantly.
          </p>
        </div>

        <SearchInput initialQuery={query} />

        <div className="mt-10">
          <SearchResults
            query={query}
            matches={result.matches}
            mode={result.mode}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>
    </main>
  )
}
