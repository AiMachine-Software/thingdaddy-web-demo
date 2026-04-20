import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Plus, Zap, Filter } from 'lucide-react'
import {
  getRulesForOrg,
  updateRule,
  deleteRule,
  type AutomationRule,
} from '#/lib/rulesEngine'
import { getCurrentOrgId } from '#/lib/tenant'
import RuleCard from '../components/RuleCard'
import SimulationPanel from '../components/SimulationPanel'

type FilterMode = 'all' | 'active' | 'paused' | 'high'

export default function RulesListPage() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [filter, setFilter] = useState<FilterMode>('all')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const orgId = getCurrentOrgId()
    if (!orgId) return
    setRules(getRulesForOrg(orgId))
  }, [refresh])

  const filtered = useMemo(() => {
    switch (filter) {
      case 'active':
        return rules.filter((r) => r.enabled)
      case 'paused':
        return rules.filter((r) => !r.enabled)
      case 'high':
        return rules.filter((r) => r.priority === 'high' || r.priority === 'critical')
      default:
        return rules
    }
  }, [rules, filter])

  const handlePauseToggle = (id: string) => {
    const rule = rules.find((r) => r.id === id)
    if (!rule) return
    updateRule(id, { enabled: !rule.enabled })
    setRefresh((x) => x + 1)
  }

  const handleDelete = (id: string) => {
    deleteRule(id)
    setConfirmDelete(null)
    setRefresh((x) => x + 1)
  }

  return (
    <main className="min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight inline-flex items-center gap-2">
            <Zap className="text-amber-500" /> Automation Rules
          </h1>
          <p className="text-gray-500 mt-2">
            Trigger device commands automatically when conditions are met.
          </p>
        </div>
        <Link
          to="/rules/create"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition shrink-0"
        >
          <Plus size={16} /> Create Rule
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Filter size={14} className="text-gray-400" />
        {(['all', 'active', 'paused', 'high'] as FilterMode[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold rounded-full px-3 py-1.5 border transition ${
              filter === f
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
            }`}
          >
            {f === 'high' ? 'High Priority' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <Zap size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-4">
            No rules match this filter.
          </p>
          <Link
            to="/rules/create"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
          >
            <Plus size={14} /> Create your first rule
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
          {filtered.map((rule, i) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
            >
              <RuleCard
                rule={rule}
                onPauseToggle={handlePauseToggle}
                onDelete={(id) => setConfirmDelete(id)}
              />
            </motion.div>
          ))}
        </div>
      )}

      <div className="mb-12">
        <SimulationPanel onComplete={() => setRefresh((x) => x + 1)} />
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete this rule?</h3>
            <p className="text-sm text-gray-500 mb-5">
              This will also remove its execution history. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDelete)}
                className="px-3 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
