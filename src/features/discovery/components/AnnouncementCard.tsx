import { Wifi, Cpu, Ban, X, ArrowRight } from 'lucide-react'
import CloudBadge from '#/features/cloud/components/CloudBadge'
import {
  processAnnouncement,
  updateAnnouncement,
  loadSettings,
  saveSettings,
  type DeviceAnnouncement,
} from '#/lib/discoveryEngine'
import { relativeTime, signalQuality } from '../lib/format'

interface Props {
  announcement: DeviceAnnouncement
  onChanged: () => void
}

const CONFIDENCE_STYLE: Record<string, string> = {
  high: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
}

const SIGNAL_STYLE: Record<string, string> = {
  excellent: 'text-emerald-600',
  good: 'text-emerald-600',
  fair: 'text-amber-600',
  poor: 'text-red-600',
  unknown: 'text-gray-400',
}

export default function AnnouncementCard({ announcement, onChanged }: Props) {
  const a = announcement
  const confClass = CONFIDENCE_STYLE[a.confidence ?? 'low']
  const sq = signalQuality(a.signalStrength)

  const handleRegister = () => {
    processAnnouncement(a.id, { force: true })
    onChanged()
  }

  const handleIgnore = () => {
    updateAnnouncement(a.id, { status: 'ignored', ignoredReason: 'Dismissed by user' })
    onChanged()
  }

  const handleBlock = () => {
    const settings = loadSettings(a.orgId)
    if (!settings.blockedMacs.includes(a.macAddress)) {
      saveSettings({
        ...settings,
        blockedMacs: [...settings.blockedMacs, a.macAddress],
      })
    }
    updateAnnouncement(a.id, {
      status: 'blocked',
      blockedReason: 'Manually blocked by user',
    })
    onChanged()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Cpu size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate">{a.deviceName}</h3>
            <p className="text-[11px] font-mono text-gray-400 truncate">{a.macAddress}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {a.cloudPlatform && <CloudBadge platform={a.cloudPlatform} />}
          <span
            className={`text-[10px] font-semibold uppercase border rounded-full px-2 py-0.5 ${confClass}`}
          >
            {a.confidence ?? 'low'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-gray-400">Protocol:</span>
          <span className="uppercase">{a.protocol}</span>
        </div>
        {a.ipAddress && (
          <div className="flex items-center gap-1">
            <span className="font-semibold text-gray-400">IP:</span>
            <span className="font-mono">{a.ipAddress}</span>
          </div>
        )}
        {a.signalStrength != null && (
          <div className="flex items-center gap-1">
            <Wifi size={11} className={SIGNAL_STYLE[sq]} />
            <span className={SIGNAL_STYLE[sq]}>{a.signalStrength} dBm</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <span className="font-semibold text-gray-400">Seen:</span>
          <span>{relativeTime(a.announcedAt)}</span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg px-3 py-2 text-[11px] space-y-0.5">
        <div>
          <span className="font-semibold text-gray-500">Suggested:</span>{' '}
          <span className="text-gray-900">{a.suggestedName ?? a.deviceName}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-500">Type:</span>{' '}
          <span className="text-gray-900">{a.suggestedThingType ?? 'GIAI'}</span>
          {a.metadata.manufacturer && (
            <span className="text-gray-400"> · {a.metadata.manufacturer}</span>
          )}
          {a.metadata.model && <span className="text-gray-400"> / {a.metadata.model}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleRegister}
          className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-600 text-white px-3 py-2 text-xs font-bold hover:bg-indigo-700"
        >
          Register <ArrowRight size={12} />
        </button>
        <button
          type="button"
          onClick={handleIgnore}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs font-semibold text-gray-600 hover:border-gray-300"
        >
          <X size={12} /> Ignore
        </button>
        <button
          type="button"
          onClick={handleBlock}
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
        >
          <Ban size={12} /> Block
        </button>
      </div>
    </div>
  )
}
