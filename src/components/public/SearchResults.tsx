import { useMemo, useState } from 'react'
import type { Asset } from '#/lib/mockDb'
import { GS1_TYPES, type Gs1Code } from '#/lib/gs1-types'
import { groupByGs1Type, type SearchMode } from '#/features/search/lib/searchEngine'
import Gs1TypeCard from './Gs1TypeCard'
import Gs1TypeFilter from './Gs1TypeFilter'
import UnavailabilityBanner from './UnavailabilityBanner'

interface Props {
  query: string
  matches: Asset[]
  mode: SearchMode
  isAuthenticated: boolean
}

export default function SearchResults({
  query,
  matches,
  mode,
  isAuthenticated,
}: Props) {
  const [selected, setSelected] = useState<Gs1Code | 'ALL'>('ALL')

  const groups = useMemo(() => groupByGs1Type(matches), [matches])
  const counts = useMemo(() => {
    const c = {} as Record<Gs1Code, number>
    for (const t of GS1_TYPES) c[t.code] = groups[t.code]?.length ?? 0
    return c
  }, [groups])

  const hasResults = matches.length > 0
  const showBanner = hasResults && mode !== 'empty'

  const visibleTypes = useMemo(() => {
    if (selected === 'ALL') {
      // When there are results, only show types that actually have matches
      // (so the "found" view stays focused). When no results, show all (catalog).
      if (hasResults) return GS1_TYPES.filter((t) => counts[t.code] > 0)
      return GS1_TYPES
    }
    return GS1_TYPES.filter((t) => t.code === selected)
  }, [selected, hasResults, counts])

  return (
    <div className="space-y-6">
      {showBanner && <UnavailabilityBanner query={query} />}

      <Gs1TypeFilter counts={counts} selected={selected} onSelect={setSelected} />

      {mode === 'empty' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-sm font-medium text-gray-700">
            Enter a company prefix or Thing ID to search
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Browse the full GS1 type catalog below.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleTypes.map((t) => (
          <Gs1TypeCard
            key={t.code}
            type={t}
            matches={groups[t.code] ?? []}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>
    </div>
  )
}
