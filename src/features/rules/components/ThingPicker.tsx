import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { mockDb, type Asset } from '#/lib/mockDb'
import { cn } from '#/lib/utils'

interface Props {
  orgId: string
  value?: string
  onChange: (thingId: string, asset: Asset) => void
  placeholder?: string
  className?: string
}

export default function ThingPicker({
  orgId,
  value,
  onChange,
  placeholder = 'Select a Thing…',
  className,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const assets = useMemo(() => mockDb.getAssets(orgId), [orgId])
  const selected = useMemo(() => assets.find((a) => a.id === value), [assets, value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return assets.slice(0, 30)
    return assets
      .filter((a) => {
        const text = [a.description, a.namespace, a.urn, a.type, a.id]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return text.includes(q)
      })
      .slice(0, 30)
  }, [assets, query])

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
      >
        <span className={cn('truncate text-left', !selected && 'text-gray-400')}>
          {selected ? selected.description ?? selected.namespace : placeholder}
        </span>
        <ChevronsUpDown size={14} className="text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Search size={14} className="text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search things…"
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-gray-400"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-gray-400">
                No things found
              </li>
            )}
            {filtered.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(a.id, a)
                    setOpen(false)
                    setQuery('')
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-indigo-50"
                >
                  <span className="flex-1 truncate">
                    <span className="font-medium text-gray-900">
                      {a.description ?? a.namespace}
                    </span>
                    <span className="block text-[10px] text-gray-400 font-mono truncate">
                      {a.type} • {a.namespace}
                    </span>
                  </span>
                  {a.id === value && <Check size={14} className="text-indigo-600" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
