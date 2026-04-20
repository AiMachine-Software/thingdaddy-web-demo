import type { CloudPlatform } from './cloudConnections'

export type DeviceProtocol =
  | 'mqtt'
  | 'coap'
  | 'http'
  | 'amqp'
  | 'lwm2m'
  | 'websocket'

export type DeviceMessageStatus = 'sent' | 'resolved' | 'delivered' | 'failed'

export interface DeviceMessage {
  id: string
  orgId: string
  fromThingId: string
  fromCloud: CloudPlatform
  toThingId: string
  toCloud: CloudPlatform
  protocol: DeviceProtocol
  topic: string
  payload: string
  route: string[]
  status: DeviceMessageStatus
  sentAt: string
  deliveredAt?: string
  latencyMs?: number
}

const MESSAGES_KEY = 'device_messages'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function newId(): string {
  return isBrowser()
    ? crypto.randomUUID()
    : `dm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function loadMessages(): DeviceMessage[] {
  if (!isBrowser()) return []
  const raw = localStorage.getItem(MESSAGES_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as DeviceMessage[]
  } catch {
    return []
  }
}

export function saveMessages(messages: DeviceMessage[]): void {
  if (!isBrowser()) return
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages))
}

export function getMessagesForOrg(orgId: string): DeviceMessage[] {
  return loadMessages().filter((m) => m.orgId === orgId)
}

export interface SendMessageInput {
  orgId: string
  fromThingId: string
  fromCloud: CloudPlatform
  toThingId: string
  toCloud: CloudPlatform
  protocol: DeviceProtocol
  topic: string
  payload: string
}

export function sendMessage(input: SendMessageInput): DeviceMessage {
  const sentAt = new Date()
  const latencyMs = 20 + Math.floor(Math.random() * 81) // 20-100ms
  const deliveredAt = new Date(sentAt.getTime() + latencyMs).toISOString()
  const message: DeviceMessage = {
    id: newId(),
    orgId: input.orgId,
    fromThingId: input.fromThingId,
    fromCloud: input.fromCloud,
    toThingId: input.toThingId,
    toCloud: input.toCloud,
    protocol: input.protocol,
    topic: input.topic,
    payload: input.payload,
    route: [input.fromCloud, 'thingdaddy', input.toCloud],
    status: 'delivered',
    sentAt: sentAt.toISOString(),
    deliveredAt,
    latencyMs,
  }
  saveMessages([message, ...loadMessages()])
  return message
}

export function clearMessages(): void {
  if (!isBrowser()) return
  localStorage.removeItem(MESSAGES_KEY)
}
