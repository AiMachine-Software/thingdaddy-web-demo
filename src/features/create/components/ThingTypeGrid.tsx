import { Lock, Sparkles } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import {
  THING_TYPES,
  recommendedFor,
  type ThingTypeConfig,
} from '../config/thing-types'
import type { AssetTypeId } from '../config/asset-types'

interface Props {
  assetTypeId: AssetTypeId | null
  selectedCode: string | null
  onSelect: (code: string) => void
}

function Box({
  type,
  isSelected,
  isRecommended,
  isMatch,
  onClick,
}: {
  type: ThingTypeConfig
  isSelected: boolean
  isRecommended: boolean
  isMatch: boolean
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={[
            'relative flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all',
            isSelected
              ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500'
              : isRecommended
                ? 'border-indigo-300 ring-1 ring-indigo-200 bg-white hover:border-indigo-400'
                : 'border-gray-200 bg-white hover:border-indigo-300',
            !isMatch && !isSelected && 'opacity-60',
          ].join(' ')}
        >
          {isRecommended && !isSelected && (
            <span className="absolute -top-2 right-2 inline-flex items-center gap-1 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-sm">
              <Sparkles className="w-2.5 h-2.5" />
              Rec
            </span>
          )}
          {!isMatch && !isSelected && (
            <Lock className="absolute top-2 right-2 w-3 h-3 text-gray-400" />
          )}
          <span className="text-sm font-bold text-gray-900">{type.label}</span>
          <span className="text-[10px] font-mono text-gray-500">{type.aiCode}</span>
          <span className="text-[11px] text-gray-600 line-clamp-2 mt-1">
            {type.description}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-semibold">{type.description}</p>
        <p className="text-[10px] opacity-80 mt-0.5">{type.aiCode}</p>
        {!type.encoder && (
          <p className="text-[10px] text-amber-300 mt-1">
            Encoder coming soon
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

export default function ThingTypeGrid({
  assetTypeId,
  selectedCode,
  onSelect,
}: Props) {
  const recCodes = recommendedFor(assetTypeId)
  const recSet = new Set(recCodes)

  const gs1Items = THING_TYPES.filter((t) => t.category === 'gs1')
  const otherItems = THING_TYPES.filter((t) => t.category === 'other')

  // "Match" = is recommended for the chosen asset type. If no asset type, all match.
  const isMatch = (t: ThingTypeConfig) =>
    !assetTypeId || recSet.has(t.code) || !!t.encoder

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            GS1 Standard Identifiers
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {gs1Items.map((t) => (
              <Box
                key={t.code}
                type={t}
                isSelected={selectedCode === t.code}
                isRecommended={recSet.has(t.code)}
                isMatch={isMatch(t)}
                onClick={() => onSelect(t.code)}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            Other Identifiers
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {otherItems.map((t) => (
              <Box
                key={t.code}
                type={t}
                isSelected={selectedCode === t.code}
                isRecommended={false}
                isMatch={isMatch(t)}
                onClick={() => onSelect(t.code)}
              />
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
