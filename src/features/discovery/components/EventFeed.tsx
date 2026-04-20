import { Radio, Zap, CheckCircle2, Link2, Shield, Ban, EyeOff, Layers, Search } from 'lucide-react'
import type { DiscoveryEvent, DiscoveryEventKind } from '#/lib/discoveryEngine'
import { relativeTime } from '../lib/format'

interface Props {
  events: DiscoveryEvent[]
  limit?: number
}

const KIND_META: Record<
  DiscoveryEventKind,
  { icon: React.ElementType; color: string; bg: string }
> = {
  announced: { icon: Radio, color: 'text-blue-600', bg: 'bg-blue-50' },
  detected: { icon: Search, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  registered: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  paired: { icon: Link2, color: 'text-teal-600', bg: 'bg-teal-50' },
  warranty: { icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
  rule_fired: { icon: Zap, color: 'text-violet-600', bg: 'bg-violet-50' },
  ignored: { icon: EyeOff, color: 'text-gray-500', bg: 'bg-gray-100' },
  blocked: { icon: Ban, color: 'text-red-600', bg: 'bg-red-50' },
  batch: { icon: Layers, color: 'text-slate-600', bg: 'bg-slate-50' },
}

export default function EventFeed({ events, limit = 30 }: Props) {
  const shown = events.slice(0, limit)
  if (shown.length === 0) {
    return (
      <p className="text-xs text-gray-500 italic py-4 text-center">No discovery events yet.</p>
    )
  }
  return (
    <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
      {shown.map((e) => {
        const meta = KIND_META[e.kind]
        const Icon = meta.icon
        return (
          <li key={e.id} className="flex items-start gap-3 text-xs">
            <div
              className={`w-7 h-7 rounded-lg ${meta.bg} ${meta.color} flex items-center justify-center shrink-0`}
            >
              <Icon size={13} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-gray-900 leading-snug">{e.message}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{relativeTime(e.timestamp)}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
