import { mockDb, type Asset } from './mockDb'
import {
  loadConnections,
  saveConnections,
  type CloudConnection,
} from './cloudConnections'
import { saveMessages, loadMessages, type DeviceMessage } from './deviceMessages'

const SEED_FLAG_KEY = 'cloud_seed_v1'

const MILESIGHT_ORG_ID = 'org_00000006-0000-0000-0000-000000000006'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function slugify(asset: Asset): string {
  // Use namespace + a piece of serial/asset ref to keep it stable
  const tail =
    asset.urn.split(':').pop() ??
    asset.id
  return `${asset.namespace}-${tail}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

function buildConnection(
  partial: Omit<CloudConnection, 'id' | 'connectedAt' | 'lastSyncAt'>,
  index: number,
): CloudConnection {
  const baseTime = new Date('2025-09-01T08:00:00Z').getTime()
  const offset = index * 60_000 // 1 minute apart for ordering
  return {
    ...partial,
    id: `cc_seed_${index.toString().padStart(4, '0')}`,
    connectedAt: new Date(baseTime + offset).toISOString(),
    lastSyncAt: new Date(baseTime + offset + 30_000).toISOString(),
  }
}

export function seedCloudDemo(): void {
  if (!isBrowser()) return
  if (localStorage.getItem(SEED_FLAG_KEY) === '1') return

  const milesightAssets = mockDb.getAssets(MILESIGHT_ORG_ID)
  if (milesightAssets.length === 0) {
    // mockDb not yet initialized; bail out — we'll be called again later
    return
  }

  const existing = loadConnections()
  // Don't re-seed if any cc_seed_ entries already present
  if (existing.some((c) => c.id.startsWith('cc_seed_'))) {
    localStorage.setItem(SEED_FLAG_KEY, '1')
    return
  }

  const connections: CloudConnection[] = []
  let i = 0

  for (const asset of milesightAssets) {
    const slug = slugify(asset)
    if (asset.type === 'consumable') {
      // SGTIN → Azure IoT Hub
      connections.push(
        buildConnection(
          {
            thingId: asset.id,
            orgId: asset.orgId,
            platform: 'azure',
            platformName: 'Azure IoT Hub',
            status: 'connected',
            externalDeviceId: `dev-milesight-${slug}`,
            endpoint: 'milesight-iot.azure-devices.net',
            metadata: {
              iotHubHostname: 'milesight-iot.azure-devices.net',
              dtdlModelId: 'dtmi:milesight:gateway;1',
              authMethod: 'SAS Token',
            },
          },
          i++,
        ),
      )
    } else if (asset.type === 'fixed') {
      // GIAI → AWS IoT Core
      connections.push(
        buildConnection(
          {
            thingId: asset.id,
            orgId: asset.orgId,
            platform: 'aws',
            platformName: 'AWS IoT Core',
            status: 'connected',
            externalDeviceId: `milesight/sensor/${slug}`,
            endpoint: 'a1b2c3.iot.ap-southeast-1.amazonaws.com',
            metadata: {
              thingName: `milesight/sensor/${slug}`,
              thingType: 'LoRaWANSensor',
              shadowName: 'firmware-status',
            },
          },
          i++,
        ),
      )
    } else if (asset.type === 'wip') {
      // CPI → FIWARE
      connections.push(
        buildConnection(
          {
            thingId: asset.id,
            orgId: asset.orgId,
            platform: 'fiware',
            platformName: 'FIWARE / oneM2M',
            status: 'connected',
            externalDeviceId: `urn:ngsi-ld:Device:${slug}`,
            endpoint: 'https://orion.milesight.fiware.org',
            metadata: {
              entityId: `urn:ngsi-ld:Device:${slug}`,
              entityType: 'Device',
              contextBrokerUrl: 'https://orion.milesight.fiware.org',
              ngsiVersion: 'LD',
            },
          },
          i++,
        ),
      )
    }
    // human (GSRN) → no cloud connection
  }

  saveConnections([...connections, ...existing])

  // Seed a few mock messages between paired Milesight devices
  const azureConns = connections.filter((c) => c.platform === 'azure').slice(0, 3)
  const awsConns = connections.filter((c) => c.platform === 'aws').slice(0, 3)
  const fiwareConns = connections.filter((c) => c.platform === 'fiware').slice(0, 2)
  const messages: DeviceMessage[] = []
  let mi = 0
  const baseTime = new Date('2026-04-07T14:00:00Z').getTime()

  function pushMessage(
    from: CloudConnection,
    to: CloudConnection,
    protocol: DeviceMessage['protocol'],
    payload: object,
  ) {
    const sentAt = new Date(baseTime - mi * 120_000)
    const latencyMs = 25 + Math.floor(Math.random() * 70)
    messages.push({
      id: `dm_seed_${mi.toString().padStart(4, '0')}`,
      orgId: from.orgId,
      fromThingId: from.thingId,
      fromCloud: from.platform,
      toThingId: to.thingId,
      toCloud: to.platform,
      protocol,
      topic: `thingdaddy/${from.externalDeviceId}/command`,
      payload: JSON.stringify(payload, null, 2),
      route: [from.platform, 'thingdaddy', to.platform],
      status: 'delivered',
      sentAt: sentAt.toISOString(),
      deliveredAt: new Date(sentAt.getTime() + latencyMs).toISOString(),
      latencyMs,
    })
    mi++
  }

  if (azureConns[0] && awsConns[0]) {
    pushMessage(azureConns[0], awsConns[0], 'mqtt', {
      command: 'getTemperature',
      requestId: 'req-001',
    })
  }
  if (awsConns[0] && azureConns[0]) {
    pushMessage(awsConns[0], azureConns[0], 'coap', {
      response: { temperature: 24.6, unit: 'C' },
      requestId: 'req-001',
    })
  }
  if (azureConns[1] && fiwareConns[0]) {
    pushMessage(azureConns[1], fiwareConns[0], 'http', {
      command: 'syncEntity',
      entityType: 'Device',
    })
  }
  if (awsConns[1] && fiwareConns[0]) {
    pushMessage(awsConns[1], fiwareConns[0], 'mqtt', {
      command: 'reportStatus',
      uplink: 'OK',
    })
  }
  if (azureConns[2] && awsConns[2]) {
    pushMessage(azureConns[2], awsConns[2], 'amqp', {
      command: 'firmwareUpdate',
      version: '1.4.2',
    })
  }

  if (messages.length > 0) {
    saveMessages([...messages, ...loadMessages()])
  }

  localStorage.setItem(SEED_FLAG_KEY, '1')
}
