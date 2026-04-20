import { useState } from 'react'
import { FlaskConical, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import {
  simulateAnnouncement,
  simulateBatch,
  processAnnouncement,
  PRESET_TEMPLATES,
  type DiscoveryProtocol,
  type DeviceAnnouncement,
} from '#/lib/discoveryEngine'
import type { CloudPlatform } from '#/lib/cloudConnections'

interface Props {
  orgId: string
  onChanged: (msg?: string) => void
}

const PROTOCOLS: DiscoveryProtocol[] = ['mqtt', 'coap', 'http', 'lwm2m', 'upnp', 'mdns']
const CLOUDS: Array<CloudPlatform | ''> = ['', 'azure', 'aws', 'gcp', 'fiware', 'onem2m']

export default function SimulatePanel({ orgId, onChanged }: Props) {
  const [expanded, setExpanded] = useState(true)
  const [name, setName] = useState('lora-temp-sensor-007')
  const [protocol, setProtocol] = useState<DiscoveryProtocol>('mqtt')
  const [cloud, setCloud] = useState<CloudPlatform | ''>('aws')
  const [metadataText, setMetadataText] = useState(
    JSON.stringify(
      {
        manufacturer: 'Milesight',
        model: 'EM-300-TH',
        firmware: '1.2.3',
        capabilities: ['temperature', 'humidity'],
        deviceType: 'sensor',
      },
      null,
      2,
    ),
  )
  const [metadataError, setMetadataError] = useState<string | null>(null)

  const quickAdd = (kind: keyof typeof PRESET_TEMPLATES) => {
    const ann = simulateAnnouncement(orgId, PRESET_TEMPLATES[kind])
    processAnnouncement(ann.id)
    onChanged(`Simulated ${kind}: ${ann.deviceName}`)
  }

  const handleManual = () => {
    let parsed: DeviceAnnouncement['metadata']
    try {
      parsed = JSON.parse(metadataText)
      setMetadataError(null)
    } catch {
      setMetadataError('Invalid JSON')
      return
    }
    const ann = simulateAnnouncement(orgId, {
      deviceName: name || 'custom-device',
      protocol,
      cloudPlatform: cloud || null,
      metadata: parsed,
    })
    processAnnouncement(ann.id)
    onChanged(`Announced ${ann.deviceName}`)
  }

  const handleBatch = () => {
    const batch = simulateBatch(orgId, 10)
    for (const ann of batch) processAnnouncement(ann.id)
    onChanged('Batch of 10 devices simulated')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-2 px-6 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
            <FlaskConical size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Simulate Device Announcement</h3>
            <p className="text-[11px] text-gray-500">
              Fake a device appearing on the network to see the full auto-registration flow.
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-5">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Quick Announce
            </p>
            <div className="flex flex-wrap gap-2">
              {(['gateway', 'sensor', 'camera', 'controller'] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => quickAdd(kind)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-600"
                >
                  + {kind.charAt(0).toUpperCase() + kind.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Manual
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[11px] font-semibold text-gray-600">Device Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-gray-600">Protocol</span>
                <select
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value as DiscoveryProtocol)}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  {PROTOCOLS.map((p) => (
                    <option key={p} value={p}>
                      {p.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-[11px] font-semibold text-gray-600">Cloud Origin</span>
                <select
                  value={cloud}
                  onChange={(e) => setCloud(e.target.value as CloudPlatform | '')}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  {CLOUDS.map((c) => (
                    <option key={c} value={c}>
                      {c ? c.toUpperCase() : '— none —'}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block mt-3">
              <span className="text-[11px] font-semibold text-gray-600">Metadata (JSON)</span>
              <textarea
                rows={8}
                value={metadataText}
                onChange={(e) => setMetadataText(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-mono"
              />
              {metadataError && (
                <p className="mt-1 text-[11px] text-red-600">{metadataError}</p>
              )}
            </label>
            <button
              type="button"
              onClick={handleManual}
              className="mt-3 inline-flex items-center gap-1 rounded-lg bg-indigo-600 text-white px-4 py-2 text-xs font-bold hover:bg-indigo-700"
            >
              <Zap size={12} /> Announce Device
            </button>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Batch
            </p>
            <button
              type="button"
              onClick={handleBatch}
              className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100"
            >
              Simulate 10 random devices appearing
            </button>
            <p className="text-[10px] text-gray-400 mt-1">
              Mix of gateways, sensors, cameras, controllers.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
