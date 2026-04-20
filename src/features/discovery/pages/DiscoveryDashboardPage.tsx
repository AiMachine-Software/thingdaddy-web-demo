import { useEffect, useState, useCallback } from 'react'
import { Link } from '@tanstack/react-router'
import { Radar, Play, Pause, Activity, History, Map } from 'lucide-react'
import { getCurrentOrgId } from '#/lib/tenant'
import {
  getAnnouncementsForOrg,
  getEventsForOrg,
  loadSettings,
  saveSettings,
  type DeviceAnnouncement,
  type DiscoveryEvent,
  type DiscoverySettings,
} from '#/lib/discoveryEngine'
import AnnouncementCard from '../components/AnnouncementCard'
import SimulatePanel from '../components/SimulatePanel'
import EventFeed from '../components/EventFeed'
import RecentlyRegisteredList from '../components/RecentlyRegisteredList'

export default function DiscoveryDashboardPage() {
  const [orgId, setOrgId] = useState<string | null>(null)
  const [scanning, setScanning] = useState(true)
  const [announcements, setAnnouncements] = useState<DeviceAnnouncement[]>([])
  const [events, setEvents] = useState<DiscoveryEvent[]>([])
  const [settings, setSettings] = useState<DiscoverySettings | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const refresh = useCallback((id: string) => {
    setAnnouncements(getAnnouncementsForOrg(id))
    setEvents(getEventsForOrg(id, 40))
    setSettings(loadSettings(id))
  }, [])

  useEffect(() => {
    const id = getCurrentOrgId()
    if (!id) return
    setOrgId(id)
    refresh(id)
  }, [refresh])

  useEffect(() => {
    if (!orgId || !scanning) return
    const interval = setInterval(() => refresh(orgId), 1500)
    return () => clearInterval(interval)
  }, [orgId, scanning, refresh])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  if (!orgId || !settings) {
    return (
      <main className="min-h-[calc(100vh-64px)] py-8 px-4 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    )
  }

  const pending = announcements.filter((a) => a.status === 'discovered')
  const registered = announcements.filter((a) => a.status === 'registered').slice(0, 6)
  const totalRegistered = announcements.filter((a) => a.status === 'registered').length

  const handleModeChange = (mode: DiscoverySettings['autoRegisterMode']) => {
    const next = { ...settings, autoRegisterMode: mode }
    saveSettings(next)
    setSettings(next)
    setToast(`Auto-registration: ${mode}`)
  }

  return (
    <main className="min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Radar size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Device Discovery
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Automatic detection and self-registration of new devices.
            </p>
          </div>
        </div>
        <Link
          to="/discovery/topology"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:border-indigo-300 hover:text-indigo-600"
        >
          <Map size={12} /> Topology View
        </Link>
      </div>

      {/* Status strip */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                scanning ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'
              }`}
            />
            <span className="font-semibold text-gray-900">
              {scanning ? 'Scanning' : 'Paused'}
            </span>
          </div>
          <div className="text-gray-500">
            <span className="font-bold text-gray-900">{pending.length}</span> pending
            <span className="mx-2 text-gray-300">|</span>
            <span className="font-bold text-gray-900">{totalRegistered}</span> auto-registered
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScanning(!scanning)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:border-indigo-300"
          >
            {scanning ? <Pause size={12} /> : <Play size={12} />}
            {scanning ? 'Stop' : 'Start Scan'}
          </button>
          <select
            value={settings.autoRegisterMode}
            onChange={(e) =>
              handleModeChange(e.target.value as DiscoverySettings['autoRegisterMode'])
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700"
          >
            <option value="off">Auto-register: Off</option>
            <option value="high_confidence">Auto-register: High-confidence</option>
            <option value="all">Auto-register: All</option>
          </select>
        </div>
      </div>

      {/* Newly Discovered */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-blue-500" /> Newly Discovered (unregistered)
        </h2>
        {pending.length === 0 ? (
          <p className="text-xs text-gray-500 italic bg-gray-50/50 border border-gray-100 rounded-xl p-6 text-center">
            No new devices waiting for review. Simulate one below.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pending.map((a) => (
              <AnnouncementCard
                key={a.id}
                announcement={a}
                onChanged={() => refresh(orgId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recently Auto-registered */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} className="text-emerald-600" />
          <h2 className="text-sm font-bold text-gray-900">Recently Auto-registered</h2>
        </div>
        <RecentlyRegisteredList announcements={registered} />
      </div>

      {/* Simulator */}
      <div className="mb-6">
        <SimulatePanel
          orgId={orgId}
          onChanged={(msg) => {
            refresh(orgId)
            if (msg) setToast(msg)
          }}
        />
      </div>

      {/* Event Feed */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <History size={16} className="text-gray-500" />
          <h2 className="text-sm font-bold text-gray-900">Discovery Event Feed</h2>
          <span className="text-xs text-gray-400">({events.length})</span>
        </div>
        <EventFeed events={events} />
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}
    </main>
  )
}
