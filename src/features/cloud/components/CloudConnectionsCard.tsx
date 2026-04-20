import { useEffect, useState } from 'react'
import { Cloud, Pencil, Plug, Unplug } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  deleteConnection,
  getConnectionsForThing,
  PLATFORM_LABELS,
  type CloudConnection,
  type CloudPlatform,
} from '#/lib/cloudConnections'
import CloudBadge from './CloudBadge'
import ConnectModal from './ConnectModal'

interface Props {
  thingId: string
  orgId: string
}

const PLATFORM_ORDER: CloudPlatform[] = ['azure', 'aws', 'gcp', 'fiware', 'custom']

export default function CloudConnectionsCard({ thingId, orgId }: Props) {
  const [connections, setConnections] = useState<CloudConnection[]>([])
  const [modalState, setModalState] = useState<{
    open: boolean
    platform: CloudPlatform
    existing?: CloudConnection
  }>({ open: false, platform: 'azure' })

  const reload = () => setConnections(getConnectionsForThing(thingId))

  useEffect(() => {
    reload()
  }, [thingId])

  const findFor = (platform: CloudPlatform) =>
    connections.find((c) => c.platform === platform)

  const openConnect = (platform: CloudPlatform, existing?: CloudConnection) =>
    setModalState({ open: true, platform, existing })

  const handleDisconnect = (id: string) => {
    if (deleteConnection(id)) reload()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
          <Cloud className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Cloud Connections</h3>
          <p className="text-xs text-gray-500">
            Map this Thing to its identifiers across cloud IoT platforms.
          </p>
        </div>
        <span className="ml-auto text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          {connections.length} connected
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PLATFORM_ORDER.map((platform) => {
          const conn = findFor(platform)
          return (
            <div
              key={platform}
              className="rounded-xl border border-gray-200 p-4 bg-gray-50/40"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CloudBadge platform={platform} size="sm" withIcon />
                  <span className="text-xs font-semibold text-gray-700">
                    {PLATFORM_LABELS[platform]}
                  </span>
                </div>
                {conn ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                    Not connected
                  </span>
                )}
              </div>

              {conn ? (
                <div className="space-y-1.5">
                  <Row label="Device ID" value={conn.externalDeviceId} mono />
                  {conn.endpoint && <Row label="Endpoint" value={conn.endpoint} mono />}
                  {conn.metadata.dtdlModelId && (
                    <Row label="Model" value={conn.metadata.dtdlModelId} mono />
                  )}
                  {conn.metadata.thingType && (
                    <Row label="Type" value={conn.metadata.thingType} />
                  )}
                  {conn.metadata.entityType && (
                    <Row label="Entity" value={conn.metadata.entityType} />
                  )}
                  {conn.metadata.protocol && (
                    <Row label="Protocol" value={conn.metadata.protocol} />
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] gap-1"
                      onClick={() => openConnect(platform, conn)}
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[11px] text-red-600 hover:bg-red-50 gap-1"
                      onClick={() => handleDisconnect(conn.id)}
                    >
                      <Unplug className="w-3 h-3" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 text-xs gap-1 mt-1"
                  onClick={() => openConnect(platform)}
                >
                  <Plug className="w-3 h-3" />
                  Connect to {PLATFORM_LABELS[platform]}
                </Button>
              )}
            </div>
          )
        })}
      </div>

      <ConnectModal
        open={modalState.open}
        onOpenChange={(open) => setModalState((s) => ({ ...s, open }))}
        thingId={thingId}
        orgId={orgId}
        platform={modalState.platform}
        existing={modalState.existing}
        onSaved={reload}
      />
    </div>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-baseline gap-2 text-[11px]">
      <span className="text-gray-500 shrink-0 w-16">{label}:</span>
      <span
        className={`text-gray-800 truncate ${mono ? 'font-mono' : ''}`}
        title={value}
      >
        {value}
      </span>
    </div>
  )
}
