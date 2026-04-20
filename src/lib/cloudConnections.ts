import { mockDb, type Asset } from './mockDb'

export type CloudPlatform =
  | 'azure'
  | 'aws'
  | 'gcp'
  | 'fiware'
  | 'onem2m'
  | 'custom'

export type CloudConnectionStatus = 'connected' | 'disconnected' | 'error'

export interface CloudConnectionMetadata {
  // Azure
  iotHubHostname?: string
  dtdlModelId?: string
  authMethod?: string
  connectionString?: string

  // AWS
  thingName?: string
  shadowName?: string
  thingType?: string

  // GCP
  projectId?: string
  registryId?: string
  region?: string

  // FIWARE / oneM2M
  entityId?: string
  entityType?: string
  contextBrokerUrl?: string
  ngsiVersion?: string

  // Custom
  protocol?: string
  notes?: string
}

export interface CloudConnection {
  id: string
  thingId: string
  orgId: string
  platform: CloudPlatform
  platformName: string
  status: CloudConnectionStatus
  externalDeviceId: string
  endpoint?: string
  metadata: CloudConnectionMetadata
  connectedAt: string
  lastSyncAt?: string
}

export const PLATFORM_LABELS: Record<CloudPlatform, string> = {
  azure: 'Azure IoT Hub',
  aws: 'AWS IoT Core',
  gcp: 'Google Cloud IoT',
  fiware: 'FIWARE / oneM2M',
  onem2m: 'oneM2M',
  custom: 'Custom Platform',
}

const CONNECTIONS_KEY = 'cloud_connections'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function newId(): string {
  return isBrowser() ? crypto.randomUUID() : `cc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function loadConnections(): CloudConnection[] {
  if (!isBrowser()) return []
  const raw = localStorage.getItem(CONNECTIONS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as CloudConnection[]
  } catch {
    return []
  }
}

export function saveConnections(connections: CloudConnection[]): void {
  if (!isBrowser()) return
  localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections))
}

export function getConnectionsForThing(thingId: string): CloudConnection[] {
  return loadConnections().filter((c) => c.thingId === thingId)
}

export function getConnectionsForOrg(orgId: string): CloudConnection[] {
  return loadConnections().filter((c) => c.orgId === orgId)
}

export function getConnectionById(id: string): CloudConnection | undefined {
  return loadConnections().find((c) => c.id === id)
}

export interface CreateConnectionInput {
  thingId: string
  orgId: string
  platform: CloudPlatform
  platformName?: string
  externalDeviceId: string
  endpoint?: string
  metadata?: CloudConnectionMetadata
  status?: CloudConnectionStatus
}

export function createConnection(input: CreateConnectionInput): CloudConnection {
  const conn: CloudConnection = {
    id: newId(),
    thingId: input.thingId,
    orgId: input.orgId,
    platform: input.platform,
    platformName: input.platformName ?? PLATFORM_LABELS[input.platform],
    status: input.status ?? 'connected',
    externalDeviceId: input.externalDeviceId,
    endpoint: input.endpoint,
    metadata: input.metadata ?? {},
    connectedAt: new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
  }
  saveConnections([conn, ...loadConnections()])
  return conn
}

export function updateConnection(
  id: string,
  updates: Partial<Omit<CloudConnection, 'id' | 'thingId' | 'orgId'>>,
): CloudConnection | undefined {
  const all = loadConnections()
  const i = all.findIndex((c) => c.id === id)
  if (i === -1) return undefined
  const next: CloudConnection = { ...all[i], ...updates }
  all[i] = next
  saveConnections(all)
  return next
}

export function deleteConnection(id: string): boolean {
  const all = loadConnections()
  const next = all.filter((c) => c.id !== id)
  if (next.length === all.length) return false
  saveConnections(next)
  return true
}

export interface ResolveResult {
  asset: Asset
  connections: CloudConnection[]
}

/**
 * Universal reverse resolver. Accepts ANY identifier:
 *  - ThingDaddy URN, EPC URI, EPC Tag URI, GS1 Element String, RFID hex, asset id
 *  - cloud connection externalDeviceId
 *  - any string field on connection.metadata (entityId, thingName, ...)
 */
export function resolveByAnyId(rawQuery: string): ResolveResult | null {
  const q = rawQuery.trim()
  if (!q) return null
  const qLower = q.toLowerCase()
  const assets = mockDb.getAssets()

  const matchAsset = (a: Asset): boolean => {
    const fields = [
      a.id,
      a.urn,
      a.epcUri,
      a.epcTagUri,
      a.elementString,
      a.rfid,
      a.digitalLinkUri,
      a.namespace,
    ]
    return fields.some((f) => f && f.toLowerCase() === qLower)
  }

  // 1) Direct asset match
  let asset = assets.find(matchAsset)

  // 2) Match against cloud connection externalDeviceId / metadata
  if (!asset) {
    const conns = loadConnections()
    const conn = conns.find((c) => {
      if (c.externalDeviceId.toLowerCase() === qLower) return true
      for (const v of Object.values(c.metadata)) {
        if (typeof v === 'string' && v.toLowerCase() === qLower) return true
      }
      return false
    })
    if (conn) {
      asset = assets.find((a) => a.id === conn.thingId)
    }
  }

  // 3) Loose contains match (last resort)
  if (!asset) {
    asset = assets.find((a) => {
      const fields = [a.urn, a.epcUri, a.elementString, a.namespace, a.description]
      return fields.some((f) => f && f.toLowerCase().includes(qLower))
    })
  }

  if (!asset) return null
  return {
    asset,
    connections: getConnectionsForThing(asset.id),
  }
}
