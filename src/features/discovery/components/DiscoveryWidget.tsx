import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Radar, ArrowRight } from 'lucide-react'
import { getCurrentOrgId } from '#/lib/tenant'
import {
  getAnnouncementsForOrg,
  getEventsForOrg,
  type DeviceAnnouncement,
  type DiscoveryEvent,
} from '#/lib/discoveryEngine'
import { relativeTime } from '../lib/format'

export default function DiscoveryWidget() {
  const [announcements, setAnnouncements] = useState<DeviceAnnouncement[]>([])
  const [events, setEvents] = useState<DiscoveryEvent[]>([])

  useEffect(() => {
    const orgId = getCurrentOrgId()
    if (!orgId) return
    setAnnouncements(getAnnouncementsForOrg(orgId))
    setEvents(getEventsForOrg(orgId, 3))
  }, [])

  const pending = announcements.filter((a) => a.status === 'discovered').length
  const registeredToday = announcements.filter((a) => {
    if (a.status !== 'registered' || !a.processedAt) return false
    const diff = Date.now() - new Date(a.processedAt).getTime()
    return diff < 24 * 60 * 60 * 1000
  }).length

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Radar size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Device Discovery</h3>
            <p className="text-[11px] text-gray-500 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Scanning network
            </p>
          </div>
        </div>
        <Link
          to="/discovery"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
        >
          Open <ArrowRight size={12} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-gray-100 bg-blue-50/30 p-3">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{pending}</p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-emerald-50/30 p-3">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Registered (24h)</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{registeredToday}</p>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
          Recent Events
        </p>
        {events.length === 0 ? (
          <p className="text-[11px] text-gray-500 italic">No events yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {events.map((e) => (
              <li key={e.id} className="text-[11px] text-gray-700 flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                <span className="flex-1 truncate">{e.message}</span>
                <span className="text-[10px] text-gray-400 shrink-0">{relativeTime(e.timestamp)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
