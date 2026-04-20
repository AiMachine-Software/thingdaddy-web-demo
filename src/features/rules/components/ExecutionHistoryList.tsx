import { Check, X } from 'lucide-react'
import type { RuleExecution } from '#/lib/rulesEngine'

interface Props {
  executions: RuleExecution[]
}

function fmt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ExecutionHistoryList({ executions }: Props) {
  if (executions.length === 0) {
    return (
      <p className="text-xs text-gray-500 italic py-4 text-center">
        No executions yet. Try the simulator to trigger this rule.
      </p>
    )
  }
  return (
    <ul className="space-y-3">
      {executions.map((e) => (
        <li
          key={e.id}
          className="rounded-xl border border-gray-100 bg-white p-3 text-xs"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-gray-900">{fmt(e.triggeredAt)}</span>
            <span className="text-[10px] text-gray-400">
              {e.triggerEvent.thingName}
            </span>
          </div>
          <div className="text-gray-600 mb-2">
            <span className="font-mono">
              {e.triggerEvent.metric} = {String(e.triggerEvent.value)}
            </span>
          </div>
          <ul className="ml-2 space-y-0.5">
            {e.actions.map((a, i) => (
              <li key={i} className="flex items-center gap-1.5 text-gray-700">
                {a.status === 'success' && <Check size={10} className="text-emerald-600" />}
                {a.status === 'failed' && <X size={10} className="text-red-500" />}
                {a.status === 'skipped' && <X size={10} className="text-gray-400" />}
                <span className="font-mono text-[10px]">
                  {a.type} → {a.target}
                </span>
                {a.latencyMs != null && (
                  <span className="text-[10px] text-gray-400">({a.latencyMs}ms)</span>
                )}
                {a.reason && (
                  <span className="text-[10px] text-gray-400">— {a.reason}</span>
                )}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}
