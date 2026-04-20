import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Zap, ArrowRight, Check } from 'lucide-react'
import {
  getRulesForOrg,
  getExecutionsForOrg,
  type AutomationRule,
  type RuleExecution,
} from '#/lib/rulesEngine'
import { getCurrentOrgId } from '#/lib/tenant'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function RulesWidget() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [executions, setExecutions] = useState<RuleExecution[]>([])

  useEffect(() => {
    const orgId = getCurrentOrgId()
    if (!orgId) return
    setRules(getRulesForOrg(orgId))
    setExecutions(getExecutionsForOrg(orgId))
  }, [])

  const active = rules.filter((r) => r.enabled).length
  const paused = rules.filter((r) => !r.enabled).length
  const todayCount = executions.filter((e) => {
    const d = new Date(e.triggeredAt)
    const now = new Date()
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    )
  }).length
  const recent = executions.slice(0, 3)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Zap size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Automation Rules</h2>
            <p className="text-xs text-gray-500">
              {active} active · {paused} paused · {todayCount} triggers today
            </p>
          </div>
        </div>
        <Link
          to="/rules"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
        >
          Manage Rules <ArrowRight size={14} />
        </Link>
      </div>

      <div>
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
          Recent triggers
        </h3>
        {recent.length === 0 ? (
          <p className="text-xs text-gray-500 italic py-2">
            No rule triggers yet. Try the simulator to fire your first rule.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recent.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between py-2 text-xs"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Check size={11} className="text-emerald-600 shrink-0" />
                  <span className="font-medium text-gray-900 truncate">
                    {e.ruleName}
                  </span>
                </span>
                <span className="text-gray-400 shrink-0 ml-2">
                  {relativeTime(e.triggeredAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
