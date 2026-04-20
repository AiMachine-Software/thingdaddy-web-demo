import { Link } from '@tanstack/react-router'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import CloudBadge from '#/features/cloud/components/CloudBadge'
import { mockDb } from '#/lib/mockDb'
import { getRelationshipsForChild, type DeviceAnnouncement } from '#/lib/discoveryEngine'
import { relativeTime } from '../lib/format'

interface Props {
  announcements: DeviceAnnouncement[]
}

export default function RecentlyRegisteredList({ announcements }: Props) {
  if (announcements.length === 0) {
    return (
      <p className="text-xs text-gray-500 italic py-4 text-center">
        No devices have been auto-registered yet.
      </p>
    )
  }
  return (
    <ul className="divide-y divide-gray-100">
      {announcements.map((a) => {
        const asset = a.registeredThingId ? mockDb.getAsset(a.registeredThingId) : undefined
        const rels = a.registeredThingId ? getRelationshipsForChild(a.registeredThingId) : []
        const parentAsset = rels[0] ? mockDb.getAsset(rels[0].parentThingId) : undefined
        return (
          <li key={a.id} className="py-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span className="text-sm font-bold text-gray-900 truncate">
                {a.suggestedName ?? a.deviceName}
              </span>
              <span className="text-[10px] text-gray-400">{relativeTime(a.announcedAt)}</span>
              {a.cloudPlatform && (
                <span className="ml-auto shrink-0">
                  <CloudBadge platform={a.cloudPlatform} />
                </span>
              )}
            </div>
            <div className="pl-6 space-y-0.5 text-[11px]">
              {a.registeredEpcUri && (
                <p className="font-mono text-gray-500 truncate">→ {a.registeredEpcUri}</p>
              )}
              {parentAsset && (
                <p className="text-gray-500">→ Paired with {parentAsset.description ?? parentAsset.namespace}</p>
              )}
              {asset && (
                <Link
                  to="/list/$assetId"
                  params={{ assetId: asset.id }}
                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold mt-1"
                >
                  View Thing <ArrowRight size={11} />
                </Link>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
