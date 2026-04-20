import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Beaker, Check, X, Play, Zap } from 'lucide-react'
import {
  evaluateEvent,
  PRESET_METRICS,
  type EvaluationResult,
} from '#/lib/rulesEngine'
import { mockDb } from '#/lib/mockDb'
import { getCurrentOrgId } from '#/lib/tenant'
import ThingPicker from './ThingPicker'

interface Props {
  defaultThingId?: string
  defaultMetric?: string
  defaultValue?: string
  onComplete?: () => void
}

export default function SimulationPanel({
  defaultThingId,
  defaultMetric = 'temperature',
  defaultValue = '45',
  onComplete,
}: Props) {
  const orgId = getCurrentOrgId() ?? ''
  const firstAsset = useMemo(() => {
    if (defaultThingId) return defaultThingId
    return mockDb.getAssets(orgId)[0]?.id ?? ''
  }, [orgId, defaultThingId])

  const [thingId, setThingId] = useState(firstAsset)
  const [metric, setMetric] = useState(defaultMetric)
  const [value, setValue] = useState(defaultValue)
  const [results, setResults] = useState<EvaluationResult[] | null>(null)
  const [running, setRunning] = useState(false)

  const runSimulation = () => {
    if (!thingId || !orgId) return
    setRunning(true)
    setTimeout(() => {
      // Coerce value
      const num = Number(value)
      const v: number | string | boolean =
        value === 'true'
          ? true
          : value === 'false'
            ? false
            : Number.isFinite(num) && value.trim() !== ''
              ? num
              : value
      const r = evaluateEvent({ thingId, metric, value: v }, orgId)
      setResults(r)
      setRunning(false)
      onComplete?.()
    }, 350)
  }

  return (
    <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/40 to-orange-50/40 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
          <Beaker size={18} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Rule Simulator</h3>
          <p className="text-[11px] text-gray-500">
            Test your rules by simulating a device event.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
            Device
          </label>
          <ThingPicker
            orgId={orgId}
            value={thingId}
            onChange={(id) => setThingId(id)}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
            Metric
          </label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            {PRESET_METRICS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label} {m.unit && `(${m.unit})`}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
            Value
          </label>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="45 or true"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={runSimulation}
        disabled={running || !thingId}
        className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50 transition"
      >
        <Play size={12} />
        {running ? 'Running…' : 'Simulate Event'}
      </button>

      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 border-t border-amber-200 pt-4"
          >
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
              Simulation Result
            </h4>
            <div className="rounded-lg bg-white border border-gray-100 p-3 mb-3 text-xs">
              <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                <Zap size={12} /> Event:
              </span>{' '}
              {mockDb.getAsset(thingId)?.description ?? thingId} · {metric} = {value}
            </div>
            {results.length === 0 && (
              <p className="text-xs text-gray-500 italic">
                No rules defined for this organization.
              </p>
            )}
            <ul className="space-y-2">
              {results.map((r) => (
                <li
                  key={r.rule.id}
                  className={`rounded-lg border p-3 text-xs ${
                    r.matched
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {r.matched ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <X size={14} className="text-gray-400" />
                    )}
                    <span className="font-semibold text-gray-900">{r.rule.name}</span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider ${
                        r.matched ? 'text-emerald-700' : 'text-gray-500'
                      }`}
                    >
                      {r.matched ? 'triggered' : `skipped${r.reason ? ` · ${r.reason}` : ''}`}
                    </span>
                  </div>
                  {r.execution && (
                    <ul className="ml-5 mt-1 space-y-0.5 text-gray-700">
                      {r.execution.actions.map((a, i) => (
                        <li key={i} className="flex items-center gap-1.5">
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
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
