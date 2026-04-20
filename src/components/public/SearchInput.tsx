import { useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '#/components/ui/button'
import { detectMode, type SearchMode } from '#/features/search/lib/searchEngine'

const MODE_LABEL: Record<SearchMode, string> = {
  prefix: 'Searching by: Company Prefix (GLN)',
  'thing-id': 'Searching by: Thing ID',
  free: 'Searching by: Free text',
  empty: 'Enter a Company Prefix or Thing ID',
}

export default function SearchInput({ initialQuery = '' }: { initialQuery?: string }) {
  const navigate = useNavigate()
  const [value, setValue] = useState(initialQuery)

  useEffect(() => {
    setValue(initialQuery)
  }, [initialQuery])

  const mode = detectMode(value)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const q = value.trim()
    navigate({ to: '/search', search: q ? ({ q } as any) : ({} as any) })
  }

  return (
    <div className="w-full">
      <form
        onSubmit={onSubmit}
        className="flex flex-col sm:flex-row gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm focus-within:border-indigo-300 focus-within:shadow-indigo-200/40 transition-all"
      >
        <div className="flex-1 flex items-center gap-2 px-4">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search a Thing ID or Company Prefix (e.g. 6922927)"
            className="w-full bg-transparent text-gray-900 placeholder:text-gray-400 py-3 focus:outline-none"
          />
        </div>
        <Button
          type="submit"
          className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
        >
          Search
        </Button>
      </form>
      <p className="mt-2 ml-2 text-xs font-medium text-gray-500">
        {MODE_LABEL[mode]}
      </p>
    </div>
  )
}
