import { motion } from 'motion/react'
import { cn } from '#/lib/utils'
import type { AssetTypeConfig } from '../config/asset-types'

interface AssetTypeCardProps {
  config: AssetTypeConfig
  isSelected: boolean
  onClick: () => void
}

export function AssetTypeCard({ config, isSelected, onClick }: AssetTypeCardProps) {
  const Icon = config.icon

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative flex flex-col items-start gap-3 rounded-2xl border p-6 text-left transition-colors cursor-pointer',
        isSelected
          ? 'ring-2 ring-primary border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/40',
      )}
    >
      {isSelected && (
        <span className="absolute top-3 right-3 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
          Selected
        </span>
      )}

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-5 w-5 text-foreground" />
      </div>

      <div>
        <h3 className="text-base font-semibold text-foreground">{config.label}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{config.subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
          {config.gs1Scheme}
        </span>
        <span className="text-xs text-muted-foreground">{config.aiCodes}</span>
      </div>
    </motion.button>
  )
}
