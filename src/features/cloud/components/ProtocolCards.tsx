interface Protocol {
  name: string
  port: string
  transport: string
  feature: string
  bestFor: string
}

const PROTOCOLS: Protocol[] = [
  {
    name: 'MQTT',
    port: '1883 / 8883',
    transport: 'TCP',
    feature: 'QoS 0, 1, 2',
    bestFor: 'Telemetry, commands',
  },
  {
    name: 'CoAP',
    port: '5683 / 5684',
    transport: 'UDP',
    feature: 'Confirmable',
    bestFor: 'Constrained sensors',
  },
  {
    name: 'HTTP/REST',
    port: '443',
    transport: 'TCP',
    feature: 'Req/Response',
    bestFor: 'APIs, config mgmt',
  },
  {
    name: 'AMQP',
    port: '5671',
    transport: 'TCP',
    feature: 'Queue-based',
    bestFor: 'Enterprise, reliable msg',
  },
  {
    name: 'LwM2M',
    port: 'over CoAP',
    transport: 'UDP',
    feature: 'OMA standard',
    bestFor: 'Device mgmt, firmware OTA',
  },
  {
    name: 'WebSocket',
    port: '443',
    transport: 'TCP',
    feature: 'Full-duplex',
    bestFor: 'Real-time dashboards',
  },
]

export default function ProtocolCards() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
      <h3 className="text-sm font-bold text-gray-900 mb-4">
        Supported IoT Protocols
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PROTOCOLS.map((p) => (
          <div
            key={p.name}
            className="rounded-xl border border-gray-200 bg-gray-50/40 p-3"
          >
            <div className="text-sm font-bold text-gray-900">{p.name}</div>
            <dl className="mt-2 space-y-0.5 text-[10px] text-gray-600">
              <Row label="Port" value={p.port} />
              <Row label="Transport" value={p.transport} />
              <Row label="Feature" value={p.feature} />
            </dl>
            <p className="mt-2 text-[10px] text-gray-500">
              <span className="font-semibold text-gray-700">Best for:</span>{' '}
              {p.bestFor}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-gray-400">{label}:</dt>
      <dd className="font-mono text-gray-700 truncate">{value}</dd>
    </div>
  )
}
