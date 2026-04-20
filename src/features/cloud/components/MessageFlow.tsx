import { ArrowRight, Cloud, Cpu, Server } from 'lucide-react'
import CloudBadge from './CloudBadge'
import type { CloudPlatform } from '#/lib/cloudConnections'
import type { DeviceProtocol } from '#/lib/deviceMessages'

interface Props {
  fromName: string
  fromCloud: CloudPlatform
  toName: string
  toCloud: CloudPlatform
  protocol: DeviceProtocol
  latencyMs?: number
}

const PROTOCOL_LABEL: Record<DeviceProtocol, string> = {
  mqtt: 'MQTT',
  coap: 'CoAP',
  http: 'HTTP',
  amqp: 'AMQP',
  lwm2m: 'LwM2M',
  websocket: 'WebSocket',
}

export default function MessageFlow({
  fromName,
  fromCloud,
  toName,
  toCloud,
  protocol,
  latencyMs,
}: Props) {
  const protoLabel = PROTOCOL_LABEL[protocol]
  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-sky-50/40 p-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700">
          Message Flow
        </h4>
        {latencyMs !== undefined && (
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
            ✓ Delivered • {latencyMs}ms
          </span>
        )}
      </div>

      <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
        <Node icon={<Cpu className="w-4 h-4" />} title={fromName} subtitle="Source device" />
        <Edge protocol={protoLabel} />
        <Node
          icon={<Cloud className="w-4 h-4" />}
          title={<CloudBadge platform={fromCloud} size="sm" />}
          subtitle="Source cloud"
        />
        <Edge protocol="resolve" />
        <Node
          icon={<Server className="w-4 h-4 text-indigo-600" />}
          title={<span className="text-indigo-700 font-bold">ThingDaddy</span>}
          subtitle="Universal resolver"
          highlight
        />
        <Edge protocol="resolve" />
        <Node
          icon={<Cloud className="w-4 h-4" />}
          title={<CloudBadge platform={toCloud} size="sm" />}
          subtitle="Target cloud"
        />
        <Edge protocol={protoLabel} />
        <Node icon={<Cpu className="w-4 h-4" />} title={toName} subtitle="Target device" />
      </div>
    </div>
  )
}

function Node({
  icon,
  title,
  subtitle,
  highlight,
}: {
  icon: React.ReactNode
  title: React.ReactNode
  subtitle: string
  highlight?: boolean
}) {
  return (
    <div
      className={`shrink-0 min-w-[120px] max-w-[160px] rounded-xl border p-3 text-center ${
        highlight
          ? 'bg-white border-indigo-300 shadow-sm shadow-indigo-100'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex justify-center mb-1.5 text-gray-500">{icon}</div>
      <div className="text-[11px] font-semibold text-gray-800 truncate">{title}</div>
      <div className="text-[9px] uppercase tracking-wider text-gray-400 mt-0.5">
        {subtitle}
      </div>
    </div>
  )
}

function Edge({ protocol }: { protocol: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-gray-400 shrink-0">
      <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-500 bg-white border border-indigo-100 rounded-full px-1.5 py-0.5 mb-1">
        {protocol}
      </span>
      <ArrowRight className="w-4 h-4" />
    </div>
  )
}
