import { useEffect, useMemo, useState } from 'react'
import { Send, Radio } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Textarea } from '#/components/ui/textarea'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { getCurrentOrgId } from '#/lib/tenant'
import { mockDb, type Asset } from '#/lib/mockDb'
import {
  getConnectionsForOrg,
  type CloudConnection,
} from '#/lib/cloudConnections'
import {
  getMessagesForOrg,
  sendMessage,
  type DeviceMessage,
  type DeviceProtocol,
} from '#/lib/deviceMessages'
import MessageFlow from '../components/MessageFlow'
import ProtocolCards from '../components/ProtocolCards'
import CloudBadge from '../components/CloudBadge'

const PROTOCOLS: { value: DeviceProtocol; label: string }[] = [
  { value: 'mqtt', label: 'MQTT' },
  { value: 'coap', label: 'CoAP' },
  { value: 'http', label: 'HTTP' },
  { value: 'amqp', label: 'AMQP' },
  { value: 'lwm2m', label: 'LwM2M' },
  { value: 'websocket', label: 'WebSocket' },
]

const DEFAULT_PAYLOAD = `{
  "command": "getTemperature",
  "requestId": "req-001"
}`

export default function DeviceMessengerPage() {
  const orgId = getCurrentOrgId()
  const [connections, setConnections] = useState<CloudConnection[]>([])
  const [messages, setMessages] = useState<DeviceMessage[]>([])
  const [fromConnId, setFromConnId] = useState<string>('')
  const [toConnId, setToConnId] = useState<string>('')
  const [protocol, setProtocol] = useState<DeviceProtocol>('mqtt')
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD)
  const [lastMessage, setLastMessage] = useState<DeviceMessage | null>(null)

  useEffect(() => {
    if (!orgId) return
    const conns = getConnectionsForOrg(orgId)
    setConnections(conns)
    setMessages(getMessagesForOrg(orgId))
    if (conns.length >= 2) {
      setFromConnId(conns[0].id)
      setToConnId(conns[1].id)
    } else if (conns.length === 1) {
      setFromConnId(conns[0].id)
    }
  }, [orgId])

  const assetById = useMemo(() => {
    const map = new Map<string, Asset>()
    for (const a of mockDb.getAssets(orgId ?? undefined)) map.set(a.id, a)
    return map
  }, [orgId])

  const fromConn = connections.find((c) => c.id === fromConnId)
  const toConn = connections.find((c) => c.id === toConnId)

  const topic = fromConn
    ? `thingdaddy/${fromConn.externalDeviceId}/command`
    : 'thingdaddy/{device}/command'

  const handleSend = () => {
    if (!orgId || !fromConn || !toConn) return
    const msg = sendMessage({
      orgId,
      fromThingId: fromConn.thingId,
      fromCloud: fromConn.platform,
      toThingId: toConn.thingId,
      toCloud: toConn.platform,
      protocol,
      topic,
      payload,
    })
    setLastMessage(msg)
    setMessages(getMessagesForOrg(orgId))
  }

  const fromAsset = fromConn ? assetById.get(fromConn.thingId) : undefined
  const toAsset = toConn ? assetById.get(toConn.thingId) : undefined

  if (!orgId) {
    return (
      <main className="min-h-[calc(100vh-64px)] py-12 px-4 max-w-4xl mx-auto text-center">
        <p className="text-sm text-gray-500">Please log in to use the messenger.</p>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6 lg:px-8 w-full max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Device Messenger
        </h1>
        <p className="text-gray-500 mt-2">
          Simulate cross-cloud messages routed through ThingDaddy. Pick a source
          and target device on any cloud platform.
        </p>
      </div>

      {connections.length < 2 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">
            You need at least two connected devices to send messages.
          </p>
          <p className="text-xs text-amber-800 mt-1">
            Connect your Things to cloud platforms from the Things List or a
            Thing detail page.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Send Message</h3>
                <p className="text-xs text-gray-500">
                  Route a payload from source to target via ThingDaddy.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">
                  From Device
                </Label>
                <Select value={fromConnId} onValueChange={setFromConnId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source device" />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.map((c) => {
                      const a = assetById.get(c.thingId)
                      return (
                        <SelectItem key={c.id} value={c.id}>
                          {a?.namespace ?? c.thingId} ({c.platform})
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {fromConn && (
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                    <CloudBadge platform={fromConn.platform} size="sm" />
                    <span className="font-mono truncate" title={fromConn.externalDeviceId}>
                      {fromConn.externalDeviceId}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">
                  To Device
                </Label>
                <Select value={toConnId} onValueChange={setToConnId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target device" />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.map((c) => {
                      const a = assetById.get(c.thingId)
                      return (
                        <SelectItem key={c.id} value={c.id}>
                          {a?.namespace ?? c.thingId} ({c.platform})
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {toConn && (
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                    <CloudBadge platform={toConn.platform} size="sm" />
                    <span className="font-mono truncate" title={toConn.externalDeviceId}>
                      {toConn.externalDeviceId}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">
                  Protocol
                </Label>
                <Select
                  value={protocol}
                  onValueChange={(v) => setProtocol(v as DeviceProtocol)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROTOCOLS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Topic</Label>
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-indigo-700 truncate">
                  {topic}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Message Payload
              </Label>
              <Textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                rows={6}
                className="font-mono text-xs"
              />
            </div>

            <div className="mt-5">
              <Button
                onClick={handleSend}
                disabled={!fromConn || !toConn || fromConnId === toConnId}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              >
                <Send className="w-4 h-4" />
                Send Message
              </Button>
              {fromConnId === toConnId && fromConn && (
                <span className="ml-3 text-xs text-amber-600">
                  Source and target must differ.
                </span>
              )}
            </div>
          </div>

          {lastMessage && fromConn && toConn && (
            <MessageFlow
              fromName={fromAsset?.namespace ?? fromConn.thingId}
              fromCloud={fromConn.platform}
              toName={toAsset?.namespace ?? toConn.thingId}
              toCloud={toConn.platform}
              protocol={lastMessage.protocol}
              latencyMs={lastMessage.latencyMs}
            />
          )}

          <MessageHistory messages={messages} />
          <ProtocolCards />
        </div>
      )}
    </main>
  )
}

function MessageHistory({ messages }: { messages: DeviceMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 text-center text-xs text-gray-400">
        No messages sent yet.
      </div>
    )
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
      <h3 className="text-sm font-bold text-gray-900 mb-4">Message History</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
              <th className="py-2 pr-3 font-semibold">Time</th>
              <th className="py-2 pr-3 font-semibold">From</th>
              <th className="py-2 pr-3 font-semibold">To</th>
              <th className="py-2 pr-3 font-semibold">Protocol</th>
              <th className="py-2 pr-3 font-semibold">Route</th>
              <th className="py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {messages.slice(0, 20).map((m) => (
              <tr key={m.id} className="border-b border-gray-50 last:border-0">
                <td className="py-2 pr-3 text-gray-500 font-mono">
                  {new Date(m.sentAt).toLocaleTimeString()}
                </td>
                <td className="py-2 pr-3">
                  <CloudBadge platform={m.fromCloud} size="sm" />
                </td>
                <td className="py-2 pr-3">
                  <CloudBadge platform={m.toCloud} size="sm" />
                </td>
                <td className="py-2 pr-3 font-mono uppercase text-indigo-700">
                  {m.protocol}
                </td>
                <td className="py-2 pr-3 text-gray-500 font-mono text-[10px]">
                  {m.route.join(' → ')}
                </td>
                <td className="py-2">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {m.status}
                  </span>
                  {m.latencyMs !== undefined && (
                    <span className="ml-2 text-[10px] text-gray-400">
                      {m.latencyMs}ms
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
