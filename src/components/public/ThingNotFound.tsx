import { Link } from '@tanstack/react-router'
import { SearchX } from 'lucide-react'
import { Button } from '#/components/ui/button'

export default function ThingNotFound({ query }: { query?: string }) {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-gray-50/50 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center bg-white border border-gray-200 rounded-2xl shadow-sm p-10">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
          <SearchX className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Thing Not Found</h1>
        <p className="mt-2 text-sm text-gray-600">
          This Thing ID is not registered in the ThingDaddy registry.
        </p>
        {query && (
          <p className="mt-2 text-xs font-mono text-gray-500 break-all">
            {query}
          </p>
        )}
        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <Button asChild>
            <Link to="/search" search={query ? ({ q: query } as any) : ({} as any)}>
              Register this Thing
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
