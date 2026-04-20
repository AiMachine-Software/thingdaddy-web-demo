import { mockDb, type Asset } from './mockDb'
import {
  loadAnnouncements,
  saveAnnouncements,
  loadRelationships,
  saveRelationships,
  loadEvents,
  saveEvents,
  saveSettings,
  type DeviceAnnouncement,
  type DeviceRelationship,
  type DiscoveryEvent,
  type DiscoverySettings,
} from './discoveryEngine'
import { createConnection, getConnectionsForOrg } from './cloudConnections'

const SEED_FLAG_KEY = 'thingdaddy.discovery.seed.v1'
const MILESIGHT_ORG_ID = 'org_00000006-0000-0000-0000-000000000006'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function seedDiscoveryDemo(): void {
  if (!isBrowser()) return
  if (localStorage.getItem(SEED_FLAG_KEY) === '1') return

  const assets = mockDb.getAssets(MILESIGHT_ORG_ID)
  if (assets.length === 0) return

  const existingAnns = loadAnnouncements()
  if (existingAnns.some((a) => a.id.startsWith('ann_seed_'))) {
    localStorage.setItem(SEED_FLAG_KEY, '1')
    return
  }

  const baseDate = new Date('2026-04-08T09:00:00Z')
  const iso = (offsetMinutes: number) =>
    new Date(baseDate.getTime() - offsetMinutes * 60_000).toISOString()

  // Find existing Milesight gateways to use as pairing parents
  const gateways = assets.filter(
    (a) => a.type === 'fixed' && /UG6[57]|SG50/i.test(a.description ?? ''),
  )
  const gwA = gateways.find((g) => /UG65/i.test(g.description ?? '')) ?? gateways[0]
  const gwB = gateways.find((g) => /UG67/i.test(g.description ?? '')) ?? gateways[1] ?? gwA
  const controllers = assets.filter((a) => /UC300|UC100/i.test(a.description ?? ''))
  const ctl = controllers[0] ?? null

  // ── 2 unregistered announcements ──
  const announcements: DeviceAnnouncement[] = [
    {
      id: 'ann_seed_pending_1',
      orgId: MILESIGHT_ORG_ID,
      announcedAt: iso(0.5),
      deviceName: 'milesight-gw-new-1f',
      macAddress: 'D4:AD:20:9B:11:02',
      ipAddress: '192.168.1.45',
      protocol: 'mqtt',
      cloudPlatform: 'azure',
      cloudDeviceId: 'azure-milesight-gw-new-1f',
      metadata: {
        manufacturer: 'Milesight',
        model: 'UG67',
        firmware: '60.0.0.44',
        serialNumber: '6746A9',
        capabilities: ['lorawan', 'mqtt_bridge', '4g'],
        deviceType: 'gateway',
      },
      signalStrength: -42,
      status: 'discovered',
      suggestedAssetType: 'fixed',
      suggestedThingType: 'GIAI',
      suggestedName: 'Milesight UG67 Gateway',
      confidence: 'high',
    },
    {
      id: 'ann_seed_pending_2',
      orgId: MILESIGHT_ORG_ID,
      announcedAt: iso(2),
      deviceName: 'lora-temp-sensor-007',
      macAddress: 'D4:AD:20:9B:77:A1',
      ipAddress: '192.168.2.88',
      protocol: 'coap',
      cloudPlatform: 'aws',
      cloudDeviceId: 'aws-lora-temp-sensor-007',
      metadata: {
        manufacturer: 'Milesight',
        model: 'EM300-TH',
        firmware: '1.2.3',
        serialNumber: '77A1C4',
        capabilities: ['temperature', 'humidity'],
        deviceType: 'sensor',
      },
      signalStrength: -78,
      status: 'discovered',
      suggestedAssetType: 'fixed',
      suggestedThingType: 'GIAI',
      suggestedName: 'Milesight EM300-TH Sensor',
      confidence: 'high',
    },
  ]

  // ── 3 already-auto-registered devices: create Asset + announcement marked registered ──
  const registeredDevices: Array<{
    annId: string
    assetId: string
    desc: string
    assetRef: string
    model: string
    mac: string
    ip: string
    cloud: 'azure' | 'aws' | 'fiware'
    protocol: 'mqtt' | 'coap' | 'http'
    offsetMin: number
    pairTo?: Asset | null
  }> = [
    {
      annId: 'ann_seed_reg_1',
      assetId: 'ast_disc_seed_01',
      desc: 'Milesight VS-NEW-001 Occupancy Sensor',
      assetRef: 'ASSET-VS-NEW-001',
      model: 'VS121',
      mac: 'D4:AD:20:9B:CC:01',
      ip: '192.168.1.101',
      cloud: 'aws',
      protocol: 'coap',
      offsetMin: 5,
      pairTo: gwA,
    },
    {
      annId: 'ann_seed_reg_2',
      assetId: 'ast_disc_seed_02',
      desc: 'Milesight AM103-AUTO IAQ Sensor',
      assetRef: 'ASSET-AM103-AUTO',
      model: 'AM103',
      mac: 'D4:AD:20:9B:CC:02',
      ip: '192.168.1.102',
      cloud: 'azure',
      protocol: 'mqtt',
      offsetMin: 22,
      pairTo: gwA,
    },
    {
      annId: 'ann_seed_reg_3',
      assetId: 'ast_disc_seed_03',
      desc: 'Milesight WS301 Door Sensor (auto)',
      assetRef: 'ASSET-WS301-AUTO',
      model: 'WS301',
      mac: 'D4:AD:20:9B:CC:03',
      ip: '192.168.2.103',
      cloud: 'fiware',
      protocol: 'http',
      offsetMin: 60,
      pairTo: gwB,
    },
  ]

  const orgPrefix = '6922927' // Milesight

  for (const d of registeredDevices) {
    // Create the Asset directly (avoid audit-log side effects piling up during seed)
    const urn = `urn:thingdaddy:discovery:fixed:${d.assetRef}`
    const epcUri = `urn:epc:id:giai:${orgPrefix}.${d.assetRef}`
    const epcTagUri = `urn:epc:tag:giai-202:0.${orgPrefix}.${d.assetRef}`
    const elementString = `(8004) ${orgPrefix}${d.assetRef}`
    const asset: Asset = {
      id: d.assetId,
      orgId: MILESIGHT_ORG_ID,
      gs1CompanyPrefix: orgPrefix,
      namespace: d.assetRef.toLowerCase(),
      urn,
      epcUri,
      epcTagUri,
      elementString,
      rfid: '38' + orgPrefix + '00000000',
      digitalLinkUri: `https://id.gs1.org/8004/${orgPrefix}${d.assetRef}`,
      type: 'fixed',
      description: d.desc,
      status: 'active',
      warrantyPeriodMonths: 24,
      warrantyActivationMode: 'auto_first_scan',
      deviceMetadata: {
        macAddress: d.mac,
        ipAddress: d.ip,
        manufacturer: 'Milesight',
        model: d.model,
        firmware: '1.0.0',
        deviceType: d.model.startsWith('WS') ? 'sensor' : d.model.startsWith('VS') ? 'sensor' : 'sensor',
        protocol: d.protocol,
        signalStrength: -60,
        discoveredAt: iso(d.offsetMin),
        autoRegistered: true,
      },
      createdAt: iso(d.offsetMin),
    }
    mockDb.saveAsset(asset)

    // Create cloud connection only if not already present for this thing
    const orgConns = getConnectionsForOrg(MILESIGHT_ORG_ID)
    if (!orgConns.some((c) => c.thingId === asset.id)) {
      createConnection({
        thingId: asset.id,
        orgId: MILESIGHT_ORG_ID,
        platform: d.cloud,
        externalDeviceId: `auto/${d.assetRef.toLowerCase()}`,
        metadata: {
          thingName: d.assetRef.toLowerCase(),
          notes: 'Auto-provisioned by discovery engine (seed)',
        },
      })
    }

    // Create the matching announcement
    announcements.push({
      id: d.annId,
      orgId: MILESIGHT_ORG_ID,
      announcedAt: iso(d.offsetMin),
      deviceName: d.desc,
      macAddress: d.mac,
      ipAddress: d.ip,
      protocol: d.protocol,
      cloudPlatform: d.cloud,
      cloudDeviceId: `${d.cloud}-${d.assetRef.toLowerCase()}`,
      metadata: {
        manufacturer: 'Milesight',
        model: d.model,
        firmware: '1.0.0',
        capabilities: ['temperature'],
        deviceType: 'sensor',
      },
      signalStrength: -60,
      status: 'registered',
      suggestedAssetType: 'fixed',
      suggestedThingType: 'GIAI',
      suggestedName: d.desc,
      confidence: 'high',
      registeredThingId: asset.id,
      registeredEpcUri: epcUri,
      processedAt: iso(d.offsetMin - 0.1),
    })
  }

  saveAnnouncements([...announcements, ...existingAnns])

  // ── Relationships: 5 total — 2 pre-existing pairs + 3 for the auto-registered ──
  const relationships: DeviceRelationship[] = []
  let relIdx = 0
  const newRel = (
    parent: Asset | null | undefined,
    child: string,
    auto: boolean,
    protocol: string,
    offset: number,
  ) => {
    if (!parent) return
    relationships.push({
      id: `rel_seed_${String(relIdx++).padStart(3, '0')}`,
      orgId: MILESIGHT_ORG_ID,
      parentThingId: parent.id,
      childThingId: child,
      relationshipType: 'gateway_sensor',
      autoDiscovered: auto,
      protocol,
      status: 'active',
      createdAt: iso(offset),
    })
  }

  // Pre-existing (manual) pairings using seed assets
  const vs121 = assets.find((a) => /VS121/i.test(a.description ?? ''))
  const em300 = assets.find((a) => /EM300-TH/i.test(a.description ?? ''))
  if (vs121) newRel(gwA, vs121.id, false, 'lorawan', 60 * 24 * 30)
  if (em300) newRel(gwB, em300.id, false, 'lorawan', 60 * 24 * 20)

  // Auto-discovered pairings
  for (const d of registeredDevices) {
    newRel(d.pairTo, d.assetId, true, d.protocol, d.offsetMin)
  }

  // If we didn't hit 5, add a controller-linked relationship
  if (relationships.length < 5 && ctl && gwB) {
    newRel(gwB, ctl.id, false, 'modbus', 60 * 24 * 10)
  }

  saveRelationships([...relationships, ...loadRelationships()])

  // ── Events feed: ~15 entries ──
  const events: DiscoveryEvent[] = [
    {
      id: 'evt_seed_01',
      orgId: MILESIGHT_ORG_ID,
      timestamp: iso(0.5),
      kind: 'announced',
      message: 'New device announced: "milesight-gw-new-1f" via MQTT',
      refId: 'ann_seed_pending_1',
    },
    {
      id: 'evt_seed_02',
      orgId: MILESIGHT_ORG_ID,
      timestamp: iso(0.4),
      kind: 'detected',
      message: 'Type detected: GIAI (high) — Milesight UG67 Gateway',
      refId: 'ann_seed_pending_1',
    },
    {
      id: 'evt_seed_03',
      orgId: MILESIGHT_ORG_ID,
      timestamp: iso(2),
      kind: 'announced',
      message: 'New device announced: "lora-temp-sensor-007" via COAP',
      refId: 'ann_seed_pending_2',
    },
    {
      id: 'evt_seed_04',
      orgId: MILESIGHT_ORG_ID,
      timestamp: iso(5),
      kind: 'registered',
      message: 'Auto-registered "Milesight VS-NEW-001 Occupancy Sensor"',
      refId: 'ast_disc_seed_01',
    },
    {
      id: 'evt_seed_05',
      orgId: MILESIGHT_ORG_ID,
      timestamp: iso(5),
      kind: 'paired',
      message: `Paired with ${gwA?.description ?? 'Gateway'}`,
      refId: 'ast_disc_seed_01',
    },
    {
      id: 'evt_seed_06',
      orgId: MILESIGHT_ORG_ID,
      timestamp: iso(5),
      kind: 'warranty',
      message: 'Warranty: 24mo (pending first scan)',
      refId: 'ast_disc_seed_01',
    },
    {
      id: 'evt_seed_07',
      orgId: MILESIGHT_ORG_ID,
      timestamp: iso(22),
      kind: 'registered',
      message: 'Auto-registered "Milesight AM103-AUTO IAQ Sensor"',
      refId: 'ast_disc_seed_02',
    },
    {
      id: 'evt_seed_08',
      orgId: MILESIGHT_ORG_ID,
      timestamp: iso(22),
      kind: 'paired',
      message: `Paired with ${gwA?.description ?? 'Gateway'}`,
      refId: 'ast_disc_seed_02',
    },
    {
      id: 'evt_seed_09',
      orgId: MILESIGHT_ORG_ID,
      timestamp: iso(60),
      kind: 'registered',
      message: 'Auto-registered "Milesight WS301 Door Sensor (auto)"',
      refId: 'ast_disc_seed_03',
    },
    {
      id: 'evt_seed_10',
      orgId: MILESIGHT_ORG_ID,
      timestamp: iso(60),
      kind: 'paired',
      message: `Paired with ${gwB?.description ?? 'Gateway'}`,
      refId: 'ast_disc_seed_03',
    },
    {
      id: 'evt_seed_11',
      orgId: MILESIGHT_ORG_ID,
      timestamp: iso(90),
      kind: 'rule_fired',
      message: 'Rule "New Device Alert" fired → Dashboard notification sent',
    },
    {
      id: 'evt_seed_12',
      orgId: MILESIGHT_ORG_ID,
      timestamp: iso(120),
      kind: 'blocked',
      message: 'Blocked "test-probe-01" — MAC matches blocked pattern "A4:CF:12:*"',
    },
    {
      id: 'evt_seed_13',
      orgId: MILESIGHT_ORG_ID,
      timestamp: iso(240),
      kind: 'batch',
      message: 'Batch: 10 devices simulated — 8 auto-registered, 2 pending',
    },
    {
      id: 'evt_seed_14',
      orgId: MILESIGHT_ORG_ID,
      timestamp: iso(360),
      kind: 'ignored',
      message: 'Duplicate detected: "em300-th-04" already registered',
    },
    {
      id: 'evt_seed_15',
      orgId: MILESIGHT_ORG_ID,
      timestamp: iso(720),
      kind: 'detected',
      message: 'Type detected: GIAI (medium) — generic CoAP sensor',
    },
  ]

  saveEvents([...events, ...loadEvents()])

  // ── Settings with a blocked MAC pattern ──
  const settings: DiscoverySettings = {
    orgId: MILESIGHT_ORG_ID,
    autoRegisterMode: 'high_confidence',
    defaultThingType: 'GIAI',
    defaultWarrantyMonths: 24,
    defaultActivationMode: 'auto_first_scan',
    autoPairingEnabled: true,
    namingPattern: '{model}-{serial}',
    blockedMacs: ['A4:CF:12:*'],
    blockedNamePatterns: ['test-*'],
  }
  saveSettings(settings)

  localStorage.setItem(SEED_FLAG_KEY, '1')
}
