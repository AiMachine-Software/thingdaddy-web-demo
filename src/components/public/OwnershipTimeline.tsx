import { History, ArrowRight } from 'lucide-react'
import { mockDb, type AuditLogEntry, type Transfer } from '#/lib/mockDb'
import { formatWarrantyDate } from '#/lib/warranty'

interface Props {
  thingId: string
}

const ACTION_LABEL: Record<string, string> = {
  created: 'Registered on ThingDaddy',
  updated: 'Asset details updated',
  status_changed: 'Status changed',
  transferred: 'Ownership transferred',
  deleted: 'Asset removed',
  imported: 'Imported in bulk',
}

export default function OwnershipTimeline({ thingId }: Props) {
  const transfers: Transfer[] = mockDb
    .getTransfers()
    .filter((t) => t.thingId === thingId)
  const logs: AuditLogEntry[] = mockDb.getAuditLogs({ thingId })

  const hasHistory = transfers.length > 0 || logs.length > 0

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <History className="w-5 h-5" />
        </div>
        <h2 className="text-base font-bold text-gray-900">Ownership History</h2>
      </div>

      {!hasHistory && (
        <p className="text-sm text-gray-500">
          This Thing has been with its original owner since registration.
        </p>
      )}

      {transfers.length > 0 && (
        <ol className="relative border-l border-gray-200 pl-5 space-y-4 mb-4">
          {transfers.map((t) => {
            const fromOrg = mockDb.getOrgById(t.fromOrgId)
            const toOrg = mockDb.getOrgById(t.toOrgId)
            return (
              <li key={t.id} className="relative">
                <span className="absolute -left-[26px] top-1 w-3 h-3 rounded-full bg-amber-500 ring-2 ring-white" />
                <p className="text-xs text-gray-500">
                  {formatWarrantyDate(t.completedAt ?? t.initiatedAt)}
                </p>
                <p className="text-sm font-semibold text-gray-900 inline-flex items-center gap-2 mt-0.5">
                  {fromOrg?.name ?? t.fromOrgId}
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                  {toOrg?.name ?? t.toOrgId}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">
                  Transfer · {t.status}
                  {t.note ? ` — ${t.note}` : ''}
                </p>
              </li>
            )
          })}
        </ol>
      )}

      {transfers.length === 0 && logs.length > 0 && (
        <ol className="relative border-l border-gray-200 pl-5 space-y-4">
          {logs.slice(0, 8).map((l) => (
            <li key={l.id} className="relative">
              <span className="absolute -left-[26px] top-1 w-3 h-3 rounded-full bg-indigo-500 ring-2 ring-white" />
              <p className="text-xs text-gray-500">
                {formatWarrantyDate(l.timestamp)}
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {ACTION_LABEL[l.action] ?? l.action}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
