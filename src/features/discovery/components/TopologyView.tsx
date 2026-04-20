import { Link } from '@tanstack/react-router'
import { Server, Box, Cpu } from 'lucide-react'
import { mockDb, type Asset } from '#/lib/mockDb'
import { getConnectionsForOrg, type CloudPlatform, PLATFORM_LABELS } from '#/lib/cloudConnections'
import { getRelationshipsForOrg, getAnnouncementsForOrg } from '#/lib/discoveryEngine'

interface Props {
  orgId: string
}

const STATUS_DOT: Record<string, string> = {
  active: 'bg-emerald-500',
  suspended: 'bg-amber-500',
  retired: 'bg-gray-400',
}

export default function TopologyView({ orgId }: Props) {
  const assets = mockDb.getAssets(orgId)
  const connections = getConnectionsForOrg(orgId)
  const relationships = getRelationshipsForOrg(orgId)
  const announcements = getAnnouncementsForOrg(orgId).filter((a) => a.status === 'discovered')

  // Map thingId → platforms
  const thingPlatforms = new Map<string, Set<CloudPlatform>>()
  for (const c of connections) {
    if (!thingPlatforms.has(c.thingId)) thingPlatforms.set(c.thingId, new Set())
    thingPlatforms.get(c.thingId)!.add(c.platform)
  }

  // Group gateways by their primary cloud platform
  const gateways = assets.filter(
    (a) =>
      a.type === 'fixed' &&
      (/UG6[57]|SG50|UC300|UC100|gateway/i.test(a.description ?? '') ||
        a.deviceMetadata?.deviceType === 'gateway'),
  )

  const byCloud = new Map<CloudPlatform | 'none', Asset[]>()
  for (const gw of gateways) {
    const platforms = Array.from(thingPlatforms.get(gw.id) ?? [])
    const key: CloudPlatform | 'none' = platforms[0] ?? 'none'
    if (!byCloud.has(key)) byCloud.set(key, [])
    byCloud.get(key)!.push(gw)
  }
  // Ensure common clouds always appear
  for (const p of ['azure', 'aws', 'fiware'] as CloudPlatform[]) {
    if (!byCloud.has(p)) byCloud.set(p, [])
  }

  // children of a given gateway
  const childrenOf = (parentId: string) =>
    relationships
      .filter((r) => r.parentThingId === parentId)
      .map((r) => assets.find((a) => a.id === r.childThingId))
      .filter((a): a is Asset => a != null)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex flex-col items-center overflow-x-auto">
        {/* Registry root */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <Server size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">ThingDaddy Registry</p>
            <p className="text-[10px] text-gray-500">{assets.length} things</p>
          </div>
        </div>
        <div className="w-px h-6 bg-gray-300" />

        {/* Cloud row */}
        <div className="flex items-start gap-6 min-w-max">
          {Array.from(byCloud.entries()).map(([platform, gws]) => (
            <div key={platform} className="flex flex-col items-center">
              <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-bold text-gray-700 shadow-sm">
                {platform === 'none' ? 'No Cloud' : PLATFORM_LABELS[platform as CloudPlatform]}
              </div>
              <div className="w-px h-5 bg-gray-300" />

              {/* Gateways */}
              <div className="flex items-start gap-4">
                {gws.length === 0 ? (
                  <div className="text-[10px] text-gray-400 italic py-2">— none —</div>
                ) : (
                  gws.map((gw) => {
                    const children = childrenOf(gw.id)
                    return (
                      <div key={gw.id} className="flex flex-col items-center">
                        <Link
                          to="/list/$assetId"
                          params={{ assetId: gw.id }}
                          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-[11px] font-semibold text-gray-800 shadow-sm hover:border-indigo-300 hover:text-indigo-600 flex items-center gap-1.5 min-w-[120px]"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[gw.status ?? 'active']}`}
                          />
                          <Box size={12} className="text-gray-400" />
                          <span className="truncate">
                            {gw.description?.split(' ').slice(0, 2).join(' ') ?? gw.namespace}
                          </span>
                        </Link>
                        {children.length > 0 && (
                          <>
                            <div className="w-px h-4 bg-gray-200" />
                            <div className="flex items-start gap-2 flex-wrap justify-center max-w-[240px]">
                              {children.map((child) => (
                                <Link
                                  key={child.id}
                                  to="/list/$assetId"
                                  params={{ assetId: child.id }}
                                  className="flex flex-col items-center gap-0.5 hover:text-indigo-600"
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[child.status ?? 'active']}`}
                                  />
                                  <Cpu size={12} className="text-gray-400" />
                                  <span className="text-[9px] text-gray-500 max-w-[48px] truncate">
                                    {child.description?.split(' ')[0] ?? child.namespace}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Discovered (unregistered) overlay */}
        {announcements.length > 0 && (
          <div className="mt-8 pt-6 border-t border-dashed border-gray-300 w-full">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">
              Newly Discovered (unregistered)
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-[11px] text-blue-700 flex items-center gap-1.5"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                  {a.deviceName}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-4 text-[10px] text-gray-500 justify-center">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Suspended
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" /> Retired
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Discovered
        </span>
      </div>
    </div>
  )
}
