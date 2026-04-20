import { mockDb } from './mockDb'

// ─── Types ───────────────────────────────────────────────

export type CapabilityDirection = 'offer' | 'need'

export type CapabilityCategory =
  | 'data'
  | 'compute'
  | 'storage'
  | 'connectivity'
  | 'energy'
  | 'actuation'
  | 'custom'

export type CapabilityAvailability = 'always' | 'scheduled' | 'on_demand'

export interface ThingCapability {
  id: string
  thingId: string
  orgId: string
  direction: CapabilityDirection
  category: CapabilityCategory
  name: string
  description: string
  /** emoji or short glyph for the card */
  icon: string
  pricePerUnit: number
  unit: string
  specs: Record<string, string>
  availability: CapabilityAvailability
  schedule?: string
  active: boolean
  createdAt: string
}

// ─── Pre-built templates ────────────────────────────────

export interface CapabilityTemplate {
  direction: CapabilityDirection
  category: CapabilityCategory
  name: string
  description: string
  icon: string
  pricePerUnit: number
  unit: string
  specs: Record<string, string>
}

export const CAPABILITY_TEMPLATES: CapabilityTemplate[] = [
  {
    direction: 'offer',
    category: 'data',
    name: 'Temperature Data',
    description: 'Real-time ambient temperature readings',
    icon: '🌡️',
    pricePerUnit: 5,
    unit: '1000 readings',
    specs: { interval: '30s', accuracy: '±0.3°C' },
  },
  {
    direction: 'offer',
    category: 'data',
    name: 'Humidity Data',
    description: 'Relative humidity readings',
    icon: '💧',
    pricePerUnit: 3,
    unit: '1000 readings',
    specs: { interval: '60s', accuracy: '±2%' },
  },
  {
    direction: 'offer',
    category: 'data',
    name: 'Air Quality Data',
    description: 'CO₂, PM2.5, TVOC readings',
    icon: '🌫️',
    pricePerUnit: 4,
    unit: '1000 readings',
    specs: { interval: '60s', accuracy: '±50ppm CO₂' },
  },
  {
    direction: 'offer',
    category: 'data',
    name: 'Motion Events',
    description: 'PIR motion detection events',
    icon: '🏃',
    pricePerUnit: 2,
    unit: '100 events',
    specs: { range: '8m', angle: '120°' },
  },
  {
    direction: 'offer',
    category: 'compute',
    name: 'Edge Compute',
    description: 'Run workloads on-device',
    icon: '🖥️',
    pricePerUnit: 10,
    unit: 'hour',
    specs: { cpu: '2 cores', ram: '512MB' },
  },
  {
    direction: 'offer',
    category: 'connectivity',
    name: 'LoRa Gateway Relay',
    description: 'Relay LoRaWAN traffic upstream',
    icon: '📡',
    pricePerUnit: 1,
    unit: '100 messages',
    specs: { region: 'EU868', maxDevices: '1000' },
  },
  {
    direction: 'offer',
    category: 'energy',
    name: 'Solar Energy Surplus',
    description: 'Surplus solar energy available for trade',
    icon: '☀️',
    pricePerUnit: 2,
    unit: 'kWh',
    specs: { source: 'rooftop solar', window: 'daylight' },
  },
  {
    direction: 'offer',
    category: 'actuation',
    name: 'Valve Control',
    description: 'Actuate industrial valve on command',
    icon: '🔧',
    pricePerUnit: 8,
    unit: 'event',
    specs: { response: '<200ms', cycles: '50k' },
  },
  {
    direction: 'need',
    category: 'connectivity',
    name: 'Internet Uplink',
    description: 'Outbound internet connectivity',
    icon: '🔌',
    pricePerUnit: 50,
    unit: 'day',
    specs: { minBandwidth: '1 Mbps' },
  },
  {
    direction: 'need',
    category: 'energy',
    name: 'Power Supply',
    description: 'Electrical power',
    icon: '⚡',
    pricePerUnit: 20,
    unit: 'day',
    specs: { min: '5V 2A' },
  },
]

// ─── Storage ─────────────────────────────────────────────

const STORAGE_KEY = 'thingdaddy.economy.capabilities.v1'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function loadAll(): ThingCapability[] {
  if (!isBrowser()) return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as ThingCapability[]
  } catch {
    return []
  }
}

function saveAll(caps: ThingCapability[]): void {
  if (!isBrowser()) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(caps))
}

function newId(): string {
  return isBrowser() && typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `cap_${crypto.randomUUID().slice(0, 12)}`
    : `cap_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

// ─── API ─────────────────────────────────────────────────

export interface ListCapabilitiesQuery {
  thingId?: string
  orgId?: string
  category?: CapabilityCategory
  direction?: CapabilityDirection
  active?: boolean
}

export function listCapabilities(query: ListCapabilitiesQuery = {}): ThingCapability[] {
  let all = loadAll()
  if (query.thingId) all = all.filter((c) => c.thingId === query.thingId)
  if (query.orgId) all = all.filter((c) => c.orgId === query.orgId)
  if (query.category) all = all.filter((c) => c.category === query.category)
  if (query.direction) all = all.filter((c) => c.direction === query.direction)
  if (query.active != null) all = all.filter((c) => c.active === query.active)
  return all
}

export function getCapability(id: string): ThingCapability | undefined {
  return loadAll().find((c) => c.id === id)
}

export interface CreateCapabilityInput {
  thingId: string
  orgId?: string
  template?: CapabilityTemplate
  direction?: CapabilityDirection
  category?: CapabilityCategory
  name?: string
  description?: string
  icon?: string
  pricePerUnit?: number
  unit?: string
  specs?: Record<string, string>
  availability?: CapabilityAvailability
  schedule?: string
  active?: boolean
}

export function createCapability(input: CreateCapabilityInput): ThingCapability {
  const tpl = input.template
  const asset = mockDb.getAsset(input.thingId)
  const cap: ThingCapability = {
    id: newId(),
    thingId: input.thingId,
    orgId: input.orgId ?? asset?.orgId ?? '',
    direction: input.direction ?? tpl?.direction ?? 'offer',
    category: input.category ?? tpl?.category ?? 'data',
    name: input.name ?? tpl?.name ?? 'Service',
    description: input.description ?? tpl?.description ?? '',
    icon: input.icon ?? tpl?.icon ?? '📦',
    pricePerUnit: input.pricePerUnit ?? tpl?.pricePerUnit ?? 0,
    unit: input.unit ?? tpl?.unit ?? 'unit',
    specs: input.specs ?? tpl?.specs ?? {},
    availability: input.availability ?? 'always',
    schedule: input.schedule,
    active: input.active ?? true,
    createdAt: new Date().toISOString(),
  }
  saveAll([cap, ...loadAll()])
  return cap
}

export function updateCapability(id: string, updates: Partial<ThingCapability>): ThingCapability | undefined {
  const all = loadAll()
  const i = all.findIndex((c) => c.id === id)
  if (i === -1) return undefined
  const next = { ...all[i], ...updates, id: all[i].id }
  all[i] = next
  saveAll(all)
  return next
}

export function deleteCapability(id: string): boolean {
  const all = loadAll()
  const next = all.filter((c) => c.id !== id)
  if (next.length === all.length) return false
  saveAll(next)
  return true
}

export const CATEGORY_LABEL: Record<CapabilityCategory, string> = {
  data: 'Data',
  compute: 'Compute',
  storage: 'Storage',
  connectivity: 'Connectivity',
  energy: 'Energy',
  actuation: 'Actuation',
  custom: 'Custom',
}

export const CATEGORY_COLOR: Record<CapabilityCategory, string> = {
  data: 'bg-sky-50 text-sky-700 border-sky-200',
  compute: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  storage: 'bg-purple-50 text-purple-700 border-purple-200',
  connectivity: 'bg-teal-50 text-teal-700 border-teal-200',
  energy: 'bg-amber-50 text-amber-700 border-amber-200',
  actuation: 'bg-rose-50 text-rose-700 border-rose-200',
  custom: 'bg-gray-50 text-gray-700 border-gray-200',
}
