import { Link } from '@tanstack/react-router'
import { Edit, PauseCircle, PlayCircle, Trash2, Activity, Zap } from 'lucide-react'
import type { AutomationRule } from '#/lib/rulesEngine'
import { mockDb } from '#/lib/mockDb'

interface Props {
  rule: AutomationRule
  onPauseToggle: (id: string) => void
  onDelete: (id: string) => void
}

const PRIORITY_STYLE: Record<AutomationRule['priority'], string> = {
  low: 'bg-gray-50 text-gray-600 border-gray-200',
  normal: 'bg-blue-50 text-blue-700 border-blue-200',
  high: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
}

function relativeTime(iso?: string): string {
  if (!iso) return 'never'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function RuleCard({ rule, onPauseToggle, onDelete }: Props) {
  const sourceLabel = (() => {
    if (rule.trigger.type === 'specific_thing' && rule.trigger.thingId) {
      const a = mockDb.getAsset(rule.trigger.thingId)
      return a?.description ?? a?.namespace ?? rule.trigger.thingId
    }
    const filter = [rule.trigger.thingTypeFilter, rule.trigger.statusFilter]
      .filter(Boolean)
      .join(' • ')
    return `Any Thing${filter ? ` (${filter})` : ''}`
  })()

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`h-2 w-2 rounded-full ${rule.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}
            />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              {rule.enabled ? 'Active' : 'Paused'}
            </span>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 border ${PRIORITY_STYLE[rule.priority]}`}
            >
              {rule.priority}
            </span>
          </div>
          <h3 className="text-base font-bold text-gray-900 truncate">{rule.name}</h3>
          {rule.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{rule.description}</p>
          )}
        </div>
      </div>

      <div className="space-y-2 text-xs mb-4">
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
            IF
          </div>
          <div className="text-gray-800">
            <span className="font-medium">{sourceLabel}</span>
            <span className="text-gray-500">
              {' '}
              · {rule.trigger.metric} {rule.trigger.operator} {String(rule.trigger.threshold)}
              {rule.trigger.unit ?? ''}
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-indigo-50/40 border border-indigo-100 p-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-0.5">
            THEN
          </div>
          <div className="text-gray-800 space-y-0.5">
            {rule.actions.map((a, i) => (
              <div key={i} className="truncate">
                <span className="font-medium">{a.type.replace(/_/g, ' ')}</span>
                {a.command && <span className="text-gray-500"> · {a.command}</span>}
                {a.message && <span className="text-gray-500"> · "{a.message}"</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-gray-500 mb-3">
        <span className="inline-flex items-center gap-1">
          <Activity size={11} /> {rule.triggerCount} trigger{rule.triggerCount === 1 ? '' : 's'}
        </span>
        <span className="inline-flex items-center gap-1">
          <Zap size={11} /> {relativeTime(rule.lastTriggeredAt)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/rules/$ruleId"
          params={{ ruleId: rule.id }}
          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 transition"
        >
          <Edit size={12} /> Edit
        </Link>
        <button
          type="button"
          onClick={() => onPauseToggle(rule.id)}
          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:border-amber-300 hover:text-amber-600 transition"
        >
          {rule.enabled ? <PauseCircle size={12} /> : <PlayCircle size={12} />}
          {rule.enabled ? 'Pause' : 'Resume'}
        </button>
        <button
          type="button"
          onClick={() => onDelete(rule.id)}
          className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:border-red-300 hover:text-red-600 transition"
          aria-label="Delete rule"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}
