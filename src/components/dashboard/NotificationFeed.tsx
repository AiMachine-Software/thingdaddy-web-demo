import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Bell, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import {
  getNotificationsForOrg,
  type DashboardNotification,
} from '#/lib/rulesEngine'
import { getCurrentOrgId } from '#/lib/tenant'

const SEV_ICON = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
}

const SEV_STYLE = {
  info: 'text-blue-600 bg-blue-50',
  warning: 'text-amber-600 bg-amber-50',
  critical: 'text-red-600 bg-red-50',
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function NotificationFeed() {
  const [notes, setNotes] = useState<DashboardNotification[]>([])

  useEffect(() => {
    const orgId = getCurrentOrgId()
    if (!orgId) return
    setNotes(getNotificationsForOrg(orgId).slice(0, 4))
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
            <p className="text-xs text-gray-500">
              {notes.filter((n) => !n.read).length} unread
            </p>
          </div>
        </div>
        <Link
          to="/rules"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          View All →
        </Link>
      </div>

      {notes.length === 0 ? (
        <p className="text-xs text-gray-500 italic py-2">
          No notifications yet. Rules with "notification" actions will surface here.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {notes.map((n) => {
            const Icon = SEV_ICON[n.severity]
            return (
              <li
                key={n.id}
                className="flex items-start gap-3 py-2.5 text-xs"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${SEV_STYLE[n.severity]}`}
                >
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${n.read ? 'text-gray-500' : 'text-gray-900'}`}>
                    {n.message}
                  </p>
                  {n.ruleName && (
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                      from {n.ruleName}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">
                  {relativeTime(n.createdAt)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
