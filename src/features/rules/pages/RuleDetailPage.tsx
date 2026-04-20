import { useEffect, useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, Edit, History, Activity, ZapOff, Zap } from 'lucide-react'
import {
  getRule,
  getExecutionsForRule,
  type AutomationRule,
  type RuleExecution,
} from '#/lib/rulesEngine'
import RuleFlowDiagram from '../components/RuleFlowDiagram'
import ExecutionHistoryList from '../components/ExecutionHistoryList'
import SimulationPanel from '../components/SimulationPanel'
import RuleBuilderPage from './RuleBuilderPage'

export default function RuleDetailPage() {
  const params = useParams({ from: '/_auth/rules_/$ruleId' })
  const navigate = useNavigate()
  const [rule, setRule] = useState<AutomationRule | null>(null)
  const [executions, setExecutions] = useState<RuleExecution[]>([])
  const [editing, setEditing] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [simulating, setSimulating] = useState(false)

  useEffect(() => {
    const r = getRule(params.ruleId)
    if (!r) {
      navigate({ to: '/rules' })
      return
    }
    setRule(r)
    setExecutions(getExecutionsForRule(params.ruleId))
  }, [params.ruleId, navigate, refresh])

  if (editing) {
    return <RuleBuilderPage mode="edit" />
  }

  if (!rule) return null

  const successCount = executions.reduce(
    (sum, e) => sum + e.actions.filter((a) => a.status === 'success').length,
    0,
  )
  const failedCount = executions.reduce(
    (sum, e) => sum + e.actions.filter((a) => a.status === 'failed').length,
    0,
  )

  return (
    <main className="min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      <button
        type="button"
        onClick={() => navigate({ to: '/rules' })}
        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-4"
      >
        <ChevronLeft size={14} /> Back to Rules
      </button>

      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {rule.enabled ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                <Zap size={10} /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5">
                <ZapOff size={10} /> Paused
              </span>
            )}
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {rule.priority} priority
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">{rule.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:border-indigo-300 hover:text-indigo-600 shrink-0"
        >
          <Edit size={12} /> Edit
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Total Triggers" value={executions.length.toString()} icon={Activity} />
        <StatCard label="Successful Actions" value={successCount.toString()} icon={Zap} accent="emerald" />
        <StatCard label="Failed Actions" value={failedCount.toString()} icon={ZapOff} accent="red" />
      </div>

      <div className="mb-6">
        <RuleFlowDiagram rule={rule} simulating={simulating} />
      </div>

      <div className="mb-6">
        <SimulationPanel
          defaultThingId={
            rule.trigger.type === 'specific_thing' ? rule.trigger.thingId : undefined
          }
          defaultMetric={rule.trigger.metric}
          defaultValue={String(rule.trigger.threshold)}
          onComplete={() => {
            setSimulating(true)
            setRefresh((x) => x + 1)
            setTimeout(() => setSimulating(false), 1500)
          }}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <History size={16} className="text-gray-500" />
          <h2 className="text-base font-bold text-gray-900">Execution History</h2>
          <span className="text-xs text-gray-400">({executions.length})</span>
        </div>
        <ExecutionHistoryList executions={executions} />
      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'indigo',
}: {
  label: string
  value: string
  icon: typeof Activity
  accent?: 'indigo' | 'emerald' | 'red'
}) {
  const styles = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${styles[accent]}`}>
        <Icon size={18} />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{value}</h3>
    </div>
  )
}
