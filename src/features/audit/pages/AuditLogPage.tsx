import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Link } from '@tanstack/react-router'
import { cn } from '#/lib/utils'
import { mockDb, type AuditLogEntry, type AuditAction } from '#/lib/mockDb'
import { getCurrentOrgId } from '#/lib/tenant'
import { Button } from '#/components/ui/button'
import { PlusCircle, Pencil, Trash2, ArrowRightLeft, Download, RefreshCw, ExternalLink } from 'lucide-react'

const ACTION_CONFIG: Record<AuditAction, { label: string; icon: typeof PlusCircle; color: string }> = {
  created: { label: 'Created', icon: PlusCircle, color: 'bg-emerald-100 text-emerald-600' },
  updated: { label: 'Updated', icon: Pencil, color: 'bg-blue-100 text-blue-600' },
  deleted: { label: 'Deleted', icon: Trash2, color: 'bg-red-100 text-red-600' },
  status_changed: { label: 'Status Changed', icon: RefreshCw, color: 'bg-amber-100 text-amber-600' },
  transferred: { label: 'Transferred', icon: ArrowRightLeft, color: 'bg-purple-100 text-purple-600' },
  imported: { label: 'Imported', icon: Download, color: 'bg-cyan-100 text-cyan-600' },
}

const FILTER_OPTIONS: { value: AuditAction | 'all'; label: string }[] = [
  { value: 'all', label: 'All Actions' },
  { value: 'created', label: 'Created' },
  { value: 'updated', label: 'Updated' },
  { value: 'deleted', label: 'Deleted' },
  { value: 'status_changed', label: 'Status Changed' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'imported', label: 'Imported' },
]

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all')

  const orgId = getCurrentOrgId()

  useEffect(() => {
    const filters: { action?: string; orgId?: string } = {}
    if (actionFilter !== 'all') filters.action = actionFilter
    if (orgId) filters.orgId = orgId
    setLogs(mockDb.getAuditLogs(filters))
  }, [actionFilter, orgId])

  return (
    <main className="min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Audit Log</h1>
        <p className="text-gray-500 mt-2">Track all changes to your registered things.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActionFilter(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              actionFilter === opt.value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No audit log entries for your organization.</div>
        ) : (
          logs.map((log, idx) => {
            const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.created
            const Icon = config.icon
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                className="flex gap-4 relative"
              >
                {/* Timeline line */}
                {idx < logs.length - 1 && (
                  <div className="absolute left-[18px] top-10 bottom-0 w-px bg-gray-200" />
                )}
                {/* Icon */}
                <div className={cn('h-9 w-9 rounded-full flex items-center justify-center shrink-0 z-10', config.color)}>
                  <Icon size={16} />
                </div>
                {/* Content */}
                <div className="flex-1 pb-6 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{config.label}</span>
                    {log.thingName && (
                      <span className="text-sm text-gray-500">
                        — {log.thingName}
                      </span>
                    )}
                    {log.action !== 'deleted' && log.thingId && (
                      <Button asChild variant="ghost" size="xs" className="h-5 px-1.5 text-[10px] text-blue-600">
                        <Link to="/list/$assetId" params={{ assetId: log.thingId }}>
                          <ExternalLink size={10} className="mr-0.5" /> View
                        </Link>
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(log.timestamp).toLocaleString()}
                    {log.userId && <span> · {log.userId}</span>}
                  </p>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="mt-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      {Object.entries(log.details).map(([k, v]) => (
                        <div key={k}>
                          <span className="font-medium text-gray-600">{k}:</span>{' '}
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </main>
  )
}
