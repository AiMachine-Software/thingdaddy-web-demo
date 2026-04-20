import { mockDb, type Asset } from './mockDb'
import {
  createConnection,
  getConnectionsForThing,
  type CloudConnection,
  type CloudPlatform,
  PLATFORM_LABELS,
} from './cloudConnections'
import {
  buildGiaiUri,
  buildGiaiTagUri,
  buildGiaiElementString,
  buildGiaiDigitalLink,
  buildSgtinUri,
  buildSgtinTagUri,
  buildSgtinElementString,
  buildSgtinDigitalLink,
  buildCpiUri,
  buildCpiTagUri,
  buildCpiElementString,
  buildCpiDigitalLink,
  encodeToHex,
} from './gs1/index'

// ─── Types ───────────────────────────────────────────────

export type DiscoveryProtocol = 'mqtt' | 'coap' | 'http' | 'lwm2m' | 'upnp' | 'mdns'
export type AnnouncementStatus =
  | 'discovered'
  | 'registering'
  | 'registered'
  | 'ignored'
  | 'blocked'
export type DeviceCategory = 'gateway' | 'sensor' | 'camera' | 'controller' | 'unknown'
export type ThingType = 'SGTIN' | 'CPI' | 'GIAI' | 'GSRN'
export type AssetType = 'consumable' | 'wip' | 'fixed' | 'human'

export interface DeviceAnnouncement {
  id: string
  orgId: string
  announcedAt: string
  deviceName: string
  macAddress: string
  ipAddress?: string
  protocol: DiscoveryProtocol
  cloudPlatform?: CloudPlatform | null
  cloudDeviceId?: string
  metadata: {
    manufacturer?: string
    model?: string
    firmware?: string
    serialNumber?: string
    capabilities?: string[]
    deviceType?: DeviceCategory
  }
  signalStrength?: number
  status: AnnouncementStatus
  suggestedAssetType?: AssetType
  suggestedThingType?: ThingType
  suggestedName?: string
  confidence?: 'high' | 'medium' | 'low'
  registeredThingId?: string
  registeredEpcUri?: string
  processedAt?: string
  ignoredReason?: string
  blockedReason?: string
}

export interface DeviceRelationship {
  id: string
  orgId: string
  parentThingId: string
  childThingId: string
  relationshipType: 'gateway_sensor' | 'controller_actuator' | 'hub_device' | 'custom'
  autoDiscovered: boolean
  protocol: string
  status: 'active' | 'inactive'
  createdAt: string
}

export type DiscoveryEventKind =
  | 'announced'
  | 'detected'
  | 'registered'
  | 'paired'
  | 'warranty'
  | 'rule_fired'
  | 'ignored'
  | 'blocked'
  | 'batch'

export interface DiscoveryEvent {
  id: string
  orgId: string
  timestamp: string
  kind: DiscoveryEventKind
  message: string
  refId?: string
}

export interface DiscoverySettings {
  orgId: string
  autoRegisterMode: 'off' | 'high_confidence' | 'all'
  defaultThingType: ThingType
  defaultWarrantyMonths: number
  defaultActivationMode: 'manual' | 'auto_first_scan'
  autoPairingEnabled: boolean
  namingPattern: string
  blockedMacs: string[]
  blockedNamePatterns: string[]
}

// ─── Constants ───────────────────────────────────────────

const ANNOUNCEMENTS_KEY = 'device_announcements'
const RELATIONSHIPS_KEY = 'device_relationships'
const EVENTS_KEY = 'discovery_events'
const SETTINGS_KEY = 'discovery_settings'

const MAX_EVENTS = 300

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function newId(prefix: string): string {
  const rand = isBrowser() ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return `${prefix}_${rand.replace(/-/g, '').slice(0, 12)}`
}

// ─── Presets ─────────────────────────────────────────────

export const PRESET_TEMPLATES: Record<
  'gateway' | 'sensor' | 'camera' | 'controller',
  Partial<DeviceAnnouncement>
> = {
  gateway: {
    deviceName: 'milesight-gw-new',
    protocol: 'mqtt',
    cloudPlatform: 'azure',
    metadata: {
      manufacturer: 'Milesight',
      model: 'UG67',
      firmware: '60.0.0.44',
      capabilities: ['lorawan', 'mqtt_bridge', '4g'],
      deviceType: 'gateway',
    },
    signalStrength: -42,
  },
  sensor: {
    deviceName: 'lora-temp-sensor',
    protocol: 'coap',
    cloudPlatform: 'aws',
    metadata: {
      manufacturer: 'Milesight',
      model: 'EM300-TH',
      firmware: '1.2.3',
      capabilities: ['temperature', 'humidity'],
      deviceType: 'sensor',
    },
    signalStrength: -78,
  },
  camera: {
    deviceName: 'milesight-cam',
    protocol: 'http',
    cloudPlatform: 'azure',
    metadata: {
      manufacturer: 'Milesight',
      model: 'VS125',
      firmware: '8.1.2',
      capabilities: ['video', 'people_counter'],
      deviceType: 'camera',
    },
    signalStrength: -55,
  },
  controller: {
    deviceName: 'uc300-controller',
    protocol: 'mqtt',
    cloudPlatform: 'fiware',
    metadata: {
      manufacturer: 'Milesight',
      model: 'UC300',
      firmware: '2.0.5',
      capabilities: ['modbus', '4g', 'digital_io'],
      deviceType: 'controller',
    },
    signalStrength: -48,
  },
}

// ─── Announcements CRUD ──────────────────────────────────

export function loadAnnouncements(): DeviceAnnouncement[] {
  if (!isBrowser()) return []
  const raw = localStorage.getItem(ANNOUNCEMENTS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as DeviceAnnouncement[]
  } catch {
    return []
  }
}

export function saveAnnouncements(list: DeviceAnnouncement[]): void {
  if (!isBrowser()) return
  localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(list))
}

export function getAnnouncementsForOrg(orgId: string): DeviceAnnouncement[] {
  return loadAnnouncements()
    .filter((a) => a.orgId === orgId)
    .sort((a, b) => new Date(b.announcedAt).getTime() - new Date(a.announcedAt).getTime())
}

export function getAnnouncement(id: string): DeviceAnnouncement | undefined {
  return loadAnnouncements().find((a) => a.id === id)
}

export interface CreateAnnouncementInput
  extends Omit<DeviceAnnouncement, 'id' | 'announcedAt' | 'status'> {
  status?: AnnouncementStatus
}

export function createAnnouncement(input: CreateAnnouncementInput): DeviceAnnouncement {
  const ann: DeviceAnnouncement = {
    ...input,
    id: newId('ann'),
    announcedAt: new Date().toISOString(),
    status: input.status ?? 'discovered',
  }
  // Enrich with type suggestion
  const suggestion = suggestThingType(ann)
  ann.suggestedAssetType = suggestion.assetType
  ann.suggestedThingType = suggestion.thingType
  ann.confidence = suggestion.confidence
  ann.suggestedName = suggestion.suggestedName

  saveAnnouncements([ann, ...loadAnnouncements()])
  appendEvent({
    orgId: ann.orgId,
    kind: 'announced',
    message: `New device announced: "${ann.deviceName}" via ${ann.protocol.toUpperCase()}`,
    refId: ann.id,
  })
  return ann
}

export function updateAnnouncement(
  id: string,
  updates: Partial<DeviceAnnouncement>,
): DeviceAnnouncement | undefined {
  const all = loadAnnouncements()
  const i = all.findIndex((a) => a.id === id)
  if (i === -1) return undefined
  const next = { ...all[i], ...updates }
  all[i] = next
  saveAnnouncements(all)
  return next
}

export function deleteAnnouncement(id: string): boolean {
  const all = loadAnnouncements()
  const next = all.filter((a) => a.id !== id)
  if (next.length === all.length) return false
  saveAnnouncements(next)
  return true
}

// ─── Relationships CRUD ──────────────────────────────────

export function loadRelationships(): DeviceRelationship[] {
  if (!isBrowser()) return []
  const raw = localStorage.getItem(RELATIONSHIPS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as DeviceRelationship[]
  } catch {
    return []
  }
}

export function saveRelationships(list: DeviceRelationship[]): void {
  if (!isBrowser()) return
  localStorage.setItem(RELATIONSHIPS_KEY, JSON.stringify(list))
}

export function getRelationshipsForOrg(orgId: string): DeviceRelationship[] {
  return loadRelationships().filter((r) => r.orgId === orgId)
}

export function getRelationshipsForParent(thingId: string): DeviceRelationship[] {
  return loadRelationships().filter((r) => r.parentThingId === thingId)
}

export function getRelationshipsForChild(thingId: string): DeviceRelationship[] {
  return loadRelationships().filter((r) => r.childThingId === thingId)
}

export interface CreateRelationshipInput
  extends Omit<DeviceRelationship, 'id' | 'createdAt' | 'status'> {
  status?: 'active' | 'inactive'
}

export function createRelationship(input: CreateRelationshipInput): DeviceRelationship {
  const rel: DeviceRelationship = {
    ...input,
    id: newId('rel'),
    status: input.status ?? 'active',
    createdAt: new Date().toISOString(),
  }
  saveRelationships([rel, ...loadRelationships()])
  return rel
}

export function deleteRelationship(id: string): boolean {
  const all = loadRelationships()
  const next = all.filter((r) => r.id !== id)
  if (next.length === all.length) return false
  saveRelationships(next)
  return true
}

// ─── Events feed ─────────────────────────────────────────

export function loadEvents(): DiscoveryEvent[] {
  if (!isBrowser()) return []
  const raw = localStorage.getItem(EVENTS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as DiscoveryEvent[]
  } catch {
    return []
  }
}

export function saveEvents(list: DiscoveryEvent[]): void {
  if (!isBrowser()) return
  localStorage.setItem(EVENTS_KEY, JSON.stringify(list.slice(0, MAX_EVENTS)))
}

export function getEventsForOrg(orgId: string, limit?: number): DiscoveryEvent[] {
  const all = loadEvents()
    .filter((e) => e.orgId === orgId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return limit ? all.slice(0, limit) : all
}

export function appendEvent(input: Omit<DiscoveryEvent, 'id' | 'timestamp'>): DiscoveryEvent {
  const evt: DiscoveryEvent = {
    ...input,
    id: newId('evt'),
    timestamp: new Date().toISOString(),
  }
  saveEvents([evt, ...loadEvents()])
  return evt
}

// ─── Settings ────────────────────────────────────────────

const DEFAULT_SETTINGS = (orgId: string): DiscoverySettings => ({
  orgId,
  autoRegisterMode: 'high_confidence',
  defaultThingType: 'GIAI',
  defaultWarrantyMonths: 24,
  defaultActivationMode: 'auto_first_scan',
  autoPairingEnabled: true,
  namingPattern: '{model}-{serial}',
  blockedMacs: [],
  blockedNamePatterns: [],
})

function loadAllSettings(): Record<string, DiscoverySettings> {
  if (!isBrowser()) return {}
  const raw = localStorage.getItem(SETTINGS_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, DiscoverySettings>
  } catch {
    return {}
  }
}

export function loadSettings(orgId: string): DiscoverySettings {
  const all = loadAllSettings()
  return all[orgId] ?? DEFAULT_SETTINGS(orgId)
}

export function saveSettings(settings: DiscoverySettings): void {
  if (!isBrowser()) return
  const all = loadAllSettings()
  all[settings.orgId] = settings
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(all))
}

// ─── Engine ──────────────────────────────────────────────

function sanitize(s: string): string {
  return s
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'DEVICE'
}

function randomSerial(): string {
  return String(Math.floor(100000 + Math.random() * 899999))
}

export function suggestThingType(announcement: DeviceAnnouncement): {
  assetType: AssetType
  thingType: ThingType
  confidence: 'high' | 'medium' | 'low'
  suggestedName: string
} {
  const { deviceType, capabilities, model, manufacturer } = announcement.metadata
  const baseName =
    model && manufacturer
      ? `${manufacturer} ${model}`
      : model ?? manufacturer ?? announcement.deviceName

  // High confidence from explicit deviceType
  if (deviceType === 'gateway') {
    return { assetType: 'fixed', thingType: 'GIAI', confidence: 'high', suggestedName: `${baseName} Gateway` }
  }
  if (deviceType === 'sensor') {
    return { assetType: 'fixed', thingType: 'GIAI', confidence: 'high', suggestedName: `${baseName} Sensor` }
  }
  if (deviceType === 'camera') {
    return { assetType: 'fixed', thingType: 'GIAI', confidence: 'high', suggestedName: `${baseName} Camera` }
  }
  if (deviceType === 'controller') {
    return { assetType: 'fixed', thingType: 'GIAI', confidence: 'high', suggestedName: `${baseName} Controller` }
  }

  // Medium confidence from capabilities
  if (capabilities?.some((c) => ['temperature', 'humidity', 'co2', 'motion'].includes(c))) {
    return { assetType: 'fixed', thingType: 'GIAI', confidence: 'medium', suggestedName: `${baseName} Sensor` }
  }
  if (capabilities?.includes('barcode_scan')) {
    return { assetType: 'consumable', thingType: 'SGTIN', confidence: 'medium', suggestedName: baseName }
  }

  return { assetType: 'fixed', thingType: 'GIAI', confidence: 'low', suggestedName: baseName }
}

export function generateEpcIdentifiers(
  orgPrefix: string,
  thingType: ThingType,
  announcement: DeviceAnnouncement,
): {
  urn: string
  epcUri: string
  epcTagUri: string
  elementString: string
  digitalLinkUri: string
  rfid: string
  namespace: string
  assetRef: string
} {
  const serial = announcement.metadata.serialNumber || randomSerial()
  const nameSlug = sanitize(announcement.deviceName)

  if (thingType === 'SGTIN') {
    // Use a deterministic item reference derived from model
    const itemRef = String(
      Math.abs(hashCode(announcement.metadata.model || nameSlug)) % 900000 + 100000,
    )
    const epcUri = buildSgtinUri(orgPrefix, '0', itemRef, serial)
    return {
      namespace: nameSlug.toLowerCase(),
      assetRef: serial,
      urn: `urn:thingdaddy:discovery:consumable:${serial}`,
      epcUri,
      epcTagUri: buildSgtinTagUri(orgPrefix, '0', itemRef, serial, 0, 96),
      elementString: buildSgtinElementString(orgPrefix, '0', itemRef, serial),
      digitalLinkUri: buildSgtinDigitalLink(orgPrefix, '0', itemRef, serial),
      rfid: encodeToHex(buildSgtinTagUri(orgPrefix, '0', itemRef, serial, 0, 96)),
    }
  }

  if (thingType === 'CPI') {
    const partRef = sanitize(announcement.metadata.model || nameSlug)
    const epcUri = buildCpiUri(orgPrefix, partRef, serial)
    return {
      namespace: nameSlug.toLowerCase(),
      assetRef: serial,
      urn: `urn:thingdaddy:discovery:wip:${serial}`,
      epcUri,
      epcTagUri: buildCpiTagUri(orgPrefix, partRef, serial, 0, 96),
      elementString: buildCpiElementString(orgPrefix, partRef, serial),
      digitalLinkUri: buildCpiDigitalLink(orgPrefix, partRef, serial),
      rfid: encodeToHex(buildCpiTagUri(orgPrefix, partRef, serial, 0, 96)),
    }
  }

  // Default: GIAI. Naming convention: ASSET-<slug>
  const assetRef = `ASSET-${nameSlug}`
  const epcUri = buildGiaiUri(orgPrefix, assetRef)
  return {
    namespace: nameSlug.toLowerCase(),
    assetRef,
    urn: `urn:thingdaddy:discovery:fixed:${assetRef}`,
    epcUri,
    epcTagUri: buildGiaiTagUri(orgPrefix, assetRef, 0, 202),
    elementString: buildGiaiElementString(orgPrefix, assetRef),
    digitalLinkUri: buildGiaiDigitalLink(orgPrefix, assetRef),
    rfid: encodeToHex(buildGiaiTagUri(orgPrefix, assetRef, 0, 202)),
  }
}

function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return h
}

function matchesPattern(value: string, pattern: string): boolean {
  // wildcard '*' → regex .*
  const regex = new RegExp(
    '^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$',
    'i',
  )
  return regex.test(value)
}

export function isBlocked(
  announcement: DeviceAnnouncement,
  settings: DiscoverySettings,
): { blocked: boolean; reason?: string } {
  for (const pattern of settings.blockedMacs) {
    if (matchesPattern(announcement.macAddress, pattern)) {
      return { blocked: true, reason: `MAC matches blocked pattern "${pattern}"` }
    }
  }
  for (const pattern of settings.blockedNamePatterns) {
    if (matchesPattern(announcement.deviceName, pattern)) {
      return { blocked: true, reason: `Name matches blocked pattern "${pattern}"` }
    }
  }
  return { blocked: false }
}

function subnetOf(ip?: string): string | null {
  if (!ip) return null
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  return `${parts[0]}.${parts[1]}.${parts[2]}.`
}

export function findBestGateway(
  announcement: DeviceAnnouncement,
  orgId: string,
): Asset | null {
  const assets = mockDb.getAssets(orgId)
  const gateways = assets.filter(
    (a) => a.deviceMetadata?.deviceType === 'gateway' || /gateway|UG6[57]|SG50/i.test(a.description ?? ''),
  )
  if (gateways.length === 0) return null

  // 1. Same cloud
  if (announcement.cloudPlatform) {
    const sameCloud = gateways.find((g) =>
      getConnectionsForThing(g.id).some((c) => c.platform === announcement.cloudPlatform),
    )
    if (sameCloud) return sameCloud
  }

  // 2. Same subnet
  const subnet = subnetOf(announcement.ipAddress)
  if (subnet) {
    const sameSubnet = gateways.find((g) => {
      const gip = g.deviceMetadata?.ipAddress
      return gip && gip.startsWith(subnet)
    })
    if (sameSubnet) return sameSubnet
  }

  // 3. Fallback: first gateway in org
  return gateways[0]
}

export interface ProcessResult {
  announcement: DeviceAnnouncement
  asset?: Asset
  connection?: CloudConnection
  relationship?: DeviceRelationship
  skipped?: boolean
  reason?: string
}

export function processAnnouncement(
  announcementId: string,
  opts: { force?: boolean } = {},
): ProcessResult {
  const ann = getAnnouncement(announcementId)
  if (!ann) return { announcement: {} as DeviceAnnouncement, skipped: true, reason: 'Not found' }
  const settings = loadSettings(ann.orgId)

  // 1. Block check
  const block = isBlocked(ann, settings)
  if (block.blocked) {
    const updated = updateAnnouncement(ann.id, {
      status: 'blocked',
      blockedReason: block.reason,
      processedAt: new Date().toISOString(),
    })!
    appendEvent({
      orgId: ann.orgId,
      kind: 'blocked',
      message: `Blocked "${ann.deviceName}" — ${block.reason}`,
      refId: ann.id,
    })
    return { announcement: updated, skipped: true, reason: block.reason }
  }

  // 2. Dedupe check
  const existingAssets = mockDb.getAssets(ann.orgId)
  const dup = existingAssets.find(
    (a) =>
      a.deviceMetadata?.macAddress === ann.macAddress ||
      (a.description ?? '').toLowerCase() === ann.deviceName.toLowerCase(),
  )
  if (dup) {
    const updated = updateAnnouncement(ann.id, {
      status: 'ignored',
      ignoredReason: `Already registered as ${dup.namespace}`,
      registeredThingId: dup.id,
      processedAt: new Date().toISOString(),
    })!
    appendEvent({
      orgId: ann.orgId,
      kind: 'ignored',
      message: `Duplicate detected: "${ann.deviceName}" already registered`,
      refId: ann.id,
    })
    return { announcement: updated, skipped: true, reason: 'Duplicate' }
  }

  // 3. Type detection (already on announcement from create)
  const suggestion = {
    assetType: ann.suggestedAssetType ?? 'fixed',
    thingType: ann.suggestedThingType ?? 'GIAI',
    confidence: ann.confidence ?? 'low',
    suggestedName: ann.suggestedName ?? ann.deviceName,
  }
  appendEvent({
    orgId: ann.orgId,
    kind: 'detected',
    message: `Type detected: ${suggestion.thingType} (${suggestion.confidence}) — ${suggestion.suggestedName}`,
    refId: ann.id,
  })

  // 4. Gate on auto-register mode
  const mode = settings.autoRegisterMode
  const allowAuto =
    opts.force ||
    mode === 'all' ||
    (mode === 'high_confidence' && suggestion.confidence === 'high')
  if (!allowAuto) {
    return { announcement: ann, skipped: true, reason: 'Awaiting manual review' }
  }

  // 5. Register as Asset
  const org = mockDb.getOrgById(ann.orgId)
  const orgPrefix = org?.companyPrefix ?? '0000000'
  const ids = generateEpcIdentifiers(orgPrefix, suggestion.thingType, ann)

  const asset: Asset = {
    id: newId('ast_disc'),
    orgId: ann.orgId,
    gs1CompanyPrefix: orgPrefix,
    namespace: ids.namespace,
    urn: ids.urn,
    epcUri: ids.epcUri,
    epcTagUri: ids.epcTagUri,
    elementString: ids.elementString,
    rfid: ids.rfid,
    digitalLinkUri: ids.digitalLinkUri,
    type: suggestion.assetType,
    description: suggestion.suggestedName,
    status: 'active',
    warrantyPeriodMonths: settings.defaultWarrantyMonths,
    warrantyActivationMode: settings.defaultActivationMode,
    deviceMetadata: {
      macAddress: ann.macAddress,
      ipAddress: ann.ipAddress,
      manufacturer: ann.metadata.manufacturer,
      model: ann.metadata.model,
      firmware: ann.metadata.firmware,
      capabilities: ann.metadata.capabilities,
      deviceType: ann.metadata.deviceType ?? 'unknown',
      protocol: ann.protocol,
      signalStrength: ann.signalStrength,
      discoveredAt: ann.announcedAt,
      autoRegistered: true,
    },
    createdAt: new Date().toISOString(),
  }
  mockDb.saveAsset(asset)
  appendEvent({
    orgId: ann.orgId,
    kind: 'registered',
    message: `Auto-registered "${suggestion.suggestedName}" → ${ids.epcUri}`,
    refId: asset.id,
  })

  // 6. Cloud connection
  let connection: CloudConnection | undefined
  if (ann.cloudPlatform) {
    connection = createConnection({
      thingId: asset.id,
      orgId: asset.orgId,
      platform: ann.cloudPlatform,
      platformName: PLATFORM_LABELS[ann.cloudPlatform],
      externalDeviceId: ann.cloudDeviceId ?? `auto/${ids.namespace}`,
      endpoint: ann.cloudPlatform === 'azure'
        ? 'milesight-iot.azure-devices.net'
        : ann.cloudPlatform === 'aws'
          ? 'a1b2c3.iot.ap-southeast-1.amazonaws.com'
          : undefined,
      metadata: {
        thingName: ids.namespace,
        notes: 'Auto-provisioned by discovery engine',
      },
    })
    appendEvent({
      orgId: ann.orgId,
      kind: 'registered',
      message: `Connected to ${PLATFORM_LABELS[ann.cloudPlatform]}`,
      refId: asset.id,
    })
  }

  // 7. Auto-pairing (for sensor/camera/controller, not gateway)
  let relationship: DeviceRelationship | undefined
  if (
    settings.autoPairingEnabled &&
    ann.metadata.deviceType &&
    ann.metadata.deviceType !== 'gateway'
  ) {
    const gateway = findBestGateway(ann, ann.orgId)
    if (gateway) {
      relationship = createRelationship({
        orgId: ann.orgId,
        parentThingId: gateway.id,
        childThingId: asset.id,
        relationshipType: 'gateway_sensor',
        autoDiscovered: true,
        protocol: ann.protocol,
      })
      appendEvent({
        orgId: ann.orgId,
        kind: 'paired',
        message: `Paired with ${gateway.description ?? gateway.namespace}`,
        refId: asset.id,
      })
    }
  }

  // 8. Warranty note
  if (settings.defaultActivationMode === 'auto_first_scan' && settings.defaultWarrantyMonths > 0) {
    appendEvent({
      orgId: ann.orgId,
      kind: 'warranty',
      message: `Warranty: ${settings.defaultWarrantyMonths}mo (pending first scan)`,
      refId: asset.id,
    })
  }

  // 9. Update announcement status
  const updated = updateAnnouncement(ann.id, {
    status: 'registered',
    registeredThingId: asset.id,
    registeredEpcUri: ids.epcUri,
    processedAt: new Date().toISOString(),
  })!

  return { announcement: updated, asset, connection, relationship }
}

// ─── Simulator helpers ───────────────────────────────────

function randomMac(): string {
  const hex = () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()
  return [hex(), hex(), hex(), hex(), hex(), hex()].join(':')
}

function randomIp(): string {
  return `192.168.${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 200) + 20}`
}

const PROTOCOL_POOL: DiscoveryProtocol[] = ['mqtt', 'coap', 'http', 'lwm2m', 'mdns']

export function simulateAnnouncement(
  orgId: string,
  template?: Partial<DeviceAnnouncement>,
): DeviceAnnouncement {
  const base: CreateAnnouncementInput = {
    orgId,
    deviceName: template?.deviceName ?? `auto-device-${Math.random().toString(36).slice(2, 6)}`,
    macAddress: template?.macAddress ?? randomMac(),
    ipAddress: template?.ipAddress ?? randomIp(),
    protocol:
      template?.protocol ?? PROTOCOL_POOL[Math.floor(Math.random() * PROTOCOL_POOL.length)],
    cloudPlatform: template?.cloudPlatform ?? null,
    cloudDeviceId: template?.cloudDeviceId,
    metadata: {
      ...(template?.metadata ?? {}),
      serialNumber:
        template?.metadata?.serialNumber ?? String(Math.floor(10000 + Math.random() * 90000)),
    },
    signalStrength:
      template?.signalStrength ?? -(40 + Math.floor(Math.random() * 50)),
  }
  // Give the simulated name a unique suffix so dedupe doesn't always hit
  base.deviceName = `${base.deviceName}-${Math.random().toString(36).slice(2, 5)}`
  return createAnnouncement(base)
}

export function simulateBatch(orgId: string, count: number = 10): DeviceAnnouncement[] {
  const kinds: Array<keyof typeof PRESET_TEMPLATES> = [
    'gateway',
    'sensor',
    'sensor',
    'sensor',
    'camera',
    'controller',
  ]
  const out: DeviceAnnouncement[] = []
  for (let i = 0; i < count; i++) {
    const kind = kinds[Math.floor(Math.random() * kinds.length)]
    out.push(simulateAnnouncement(orgId, PRESET_TEMPLATES[kind]))
  }
  appendEvent({
    orgId,
    kind: 'batch',
    message: `Batch: ${count} devices simulated`,
  })
  return out
}
