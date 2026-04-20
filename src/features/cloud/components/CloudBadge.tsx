import { Cloud } from 'lucide-react'
import { cn } from '#/lib/utils'
import type { CloudPlatform } from '#/lib/cloudConnections'

const PLATFORM_STYLE: Record<
  CloudPlatform,
  { label: string; bg: string; text: string; border: string }
> = {
  azure: { label: 'Azure', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  aws: { label: 'AWS', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  gcp: { label: 'GCP', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  fiware: { label: 'FIWARE', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  onem2m: { label: 'oneM2M', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  custom: { label: 'Custom', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
}

interface Props {
  platform: CloudPlatform
  size?: 'xs' | 'sm'
  withIcon?: boolean
  className?: string
}

export default function CloudBadge({
  platform,
  size = 'xs',
  withIcon = false,
  className,
}: Props) {
  const style = PLATFORM_STYLE[platform]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-semibold',
        style.bg,
        style.text,
        style.border,
        size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        className,
      )}
    >
      {withIcon && <Cloud className={size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />}
      {style.label}
    </span>
  )
}
