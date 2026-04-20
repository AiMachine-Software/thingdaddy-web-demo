import { Briefcase, Package, Settings, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  GS1_TYPES,
  type Gs1Code,
  gs1CodeForAssetType,
} from '#/lib/gs1-types'
import type { AssetTypeId } from '#/features/create/config/asset-types'

interface Props {
  counts: Record<Gs1Code, number>
  selected: Gs1Code | 'ALL'
  onSelect: (code: Gs1Code | 'ALL') => void
}

const QUICK_FILTERS: { id: AssetTypeId; label: string; icon: LucideIcon }[] = [
  { id: 'consumable', label: 'Consumable', icon: Package },
  { id: 'wip', label: 'Work in Progress', icon: Settings },
  { id: 'fixed', label: 'Fixed Asset', icon: Briefcase },
  { id: 'human', label: 'Human Resource', icon: User },
]

export default function Gs1TypeFilter({ counts, selected, onSelect }: Props) {
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-4">
      {/* Quick category filters */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
          Quick Filters
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_FILTERS.map((qf) => {
            const code = gs1CodeForAssetType(qf.id)
            const isActive = selected === code
            const Icon = qf.icon
            return (
              <button
                key={qf.id}
                onClick={() => onSelect(isActive ? 'ALL' : code)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {qf.label}
                <span
                  className={`ml-1 px-1.5 rounded-md text-[10px] ${
                    isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {counts[code]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* All GS1 types pill row */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
          GS1 Type
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 [scrollbar-width:thin]">
          <button
            onClick={() => onSelect('ALL')}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              selected === 'ALL'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
            }`}
          >
            All Types
            <span
              className={`ml-1 px-1.5 rounded-md text-[10px] ${
                selected === 'ALL' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {totalCount}
            </span>
          </button>
          {GS1_TYPES.map((t) => {
            const isActive = selected === t.code
            return (
              <button
                key={t.code}
                onClick={() => onSelect(isActive ? 'ALL' : t.code)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                }`}
              >
                {t.code}
                <span
                  className={`ml-1 px-1.5 rounded-md text-[10px] ${
                    isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {counts[t.code]}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
