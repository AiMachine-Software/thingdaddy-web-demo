import {
  buildSgtinElementString, buildCpiElementString, buildGiaiElementString, buildGsrnElementString,
  buildSgtinUri, buildCpiUri, buildGiaiUri, buildGsrnUri,
  buildSgtinTagUri, buildCpiTagUri, buildGiaiTagUri, buildGsrnTagUri,
  encodeToHex,
  buildSgtinDigitalLink, buildCpiDigitalLink, buildGiaiDigitalLink, buildGsrnDigitalLink,
} from '#/lib/gs1/index'

// ─── Types ───────────────────────────────────────────────

export type AssetStatus = 'active' | 'suspended' | 'retired';

import type { GS1ApplicationData } from '#/features/register/types';

export type WarrantyActivationMode =
  | 'manual'
  | 'auto_first_scan'
  | 'auto_immediate'
  | 'owner_only';

export interface OrgWarrantyDefaults {
  periodMonths: number | null;
  activationMode: WarrantyActivationMode;
  terms?: string;
}

export interface Organization {
  id: string;
  name: string;
  nameLocal?: string;
  companyPrefix: string;
  country: string;
  /** Public domain registered with the org (e.g. "milesight.com") */
  domain?: string;
  /** Auto-derived ThingDaddy subdomain (e.g. "milesight.thingdaddy.com") */
  subdomain?: string;
  /** Full GS1 Thailand-style member application data */
  gs1Application?: GS1ApplicationData;
  /** Default warranty settings used when registering new Things */
  warrantyDefaults?: OrgWarrantyDefaults;
  createdAt: string;
}

export interface Asset {
  id: string;
  orgId: string;
  companyId?: string;          // legacy compat
  gs1CompanyPrefix?: string;
  namespace: string;
  urn: string;
  epcUri?: string;
  epcTagUri?: string;
  elementString?: string;
  rfid: string;
  digitalLinkUri?: string;
  type: string;
  description?: string;
  status?: AssetStatus;
  /** Optional warranty period in months (null = no warranty) */
  warrantyPeriodMonths?: number | null;
  /** ISO date string for warranty expiry (computed at registration) */
  warrantyEndDate?: string | null;
  /** Free-text warranty notes */
  warrantyNotes?: string;
  /** Manually voided warranty (overrides computed status) */
  warrantyVoid?: boolean;
  /** How the warranty becomes active (Session F consumer warranty) */
  warrantyActivationMode?: WarrantyActivationMode;
  /** When the warranty period actually starts (set on activation) */
  warrantyStartDate?: string | null;
  /** When the activation event occurred */
  warrantyActivatedAt?: string | null;
  /** Who activated it: consumer name, "auto", or owner name */
  warrantyActivatedBy?: string | null;
  /** Custom warranty terms text */
  warrantyTerms?: string;
  /** Device metadata — populated by the auto-discovery engine (Session I) */
  deviceMetadata?: {
    macAddress?: string;
    ipAddress?: string;
    manufacturer?: string;
    model?: string;
    firmware?: string;
    capabilities?: string[];
    deviceType?: 'gateway' | 'sensor' | 'camera' | 'controller' | 'unknown';
    protocol?: 'mqtt' | 'coap' | 'http' | 'lwm2m' | 'upnp' | 'mdns';
    signalStrength?: number;
    discoveredAt?: string;
    autoRegistered?: boolean;
  };
  createdAt: string;
}

export interface Transfer {
  id: string;
  thingId: string;
  fromOrgId: string;
  toOrgId: string;
  status: 'pending' | 'completed' | 'rejected';
  note?: string;
  initiatedAt: string;
  completedAt?: string;
}

export type AuditAction = 'created' | 'updated' | 'deleted' | 'status_changed' | 'transferred' | 'imported';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  thingId: string;
  thingName?: string;
  userId?: string;
  orgId?: string;
  details: Record<string, unknown>;
}

// Legacy compat
export interface Company { id: string; name: string; }
export const MOCK_COMPANIES: Company[] = [
  { id: 'cmp_001', name: 'Acme Corporation' },
  { id: 'cmp_002', name: 'Global Logistics Inc.' },
  { id: 'cmp_003', name: 'Stark Industries' },
  { id: 'cmp_004', name: 'Wayne Enterprises' },
];

// ─── Seed Data ───────────────────────────────────────────

const SEED_ORG_IDS = {
  acme: 'org_00000001-0000-0000-0000-000000000001',
  cpgroup: 'org_00000002-0000-0000-0000-000000000002',
  sony: 'org_00000003-0000-0000-0000-000000000003',
  siemens: 'org_00000004-0000-0000-0000-000000000004',
  thingdaddy: 'org_00000005-0000-0000-0000-000000000005',
  milesight: 'org_00000006-0000-0000-0000-000000000006',
};

const SEED_ORGS: Organization[] = [
  { id: SEED_ORG_IDS.acme, name: 'Acme Corporation', companyPrefix: '0614141', country: 'US', createdAt: '2025-01-01T00:00:00Z' },
  { id: SEED_ORG_IDS.cpgroup, name: 'CP Group Thailand', nameLocal: 'เจริญโภคภัณฑ์', companyPrefix: '8850002', country: 'TH', createdAt: '2025-01-15T00:00:00Z' },
  { id: SEED_ORG_IDS.sony, name: 'Sony Electronics', companyPrefix: '4902520', country: 'JP', createdAt: '2025-02-01T00:00:00Z' },
  { id: SEED_ORG_IDS.siemens, name: 'Siemens AG', companyPrefix: '4000521', country: 'DE', createdAt: '2025-02-15T00:00:00Z' },
  { id: SEED_ORG_IDS.thingdaddy, name: 'ThingDaddy Demo', nameLocal: 'ธิงแดดดี้', companyPrefix: '8858718', country: 'TH', createdAt: '2025-03-01T00:00:00Z' },
  {
    id: SEED_ORG_IDS.milesight, name: 'Milesight IoT', nameLocal: '厦门星纵智联科技有限公司',
    companyPrefix: '6922927', country: 'CN', createdAt: '2025-03-15T00:00:00Z',
    warrantyDefaults: {
      periodMonths: 24,
      activationMode: 'auto_first_scan',
      terms: 'Standard Milesight manufacturer warranty covers defects in materials and workmanship under normal use conditions for the specified period from the date of activation.',
    },
  },
];

// ─── Seed Asset Builder ──────────────────────────────────
// Generates a complete Asset with all GS1 identifiers from minimal inputs.

function buildSeedAsset(p: {
  id: string; orgId: string; prefix: string; ns: string;
  type: 'consumable' | 'wip' | 'fixed' | 'human';
  desc: string; status?: AssetStatus; date: string;
  // consumable
  ind?: string; itemRef?: string; serial?: string;
  // wip
  partRef?: string; cpiSerial?: string;
  // fixed
  assetRef?: string;
  // human
  serviceRef?: string;
}): Asset {
  let urn = '', epcUri = '', epcTagUri = '', elementString = '', digitalLinkUri = '';

  if (p.type === 'consumable') {
    const ind = p.ind || '0', ir = p.itemRef!, s = p.serial!;
    urn = `urn:thingdaddy:${p.ns}:consumable:${s}`;
    elementString = buildSgtinElementString(p.prefix, ind, ir, s);
    epcUri = buildSgtinUri(p.prefix, ind, ir, s);
    const tagSize = /[^0-9]/.test(s) ? 198 : 96;
    epcTagUri = buildSgtinTagUri(p.prefix, ind, ir, s, 0, tagSize);
    digitalLinkUri = buildSgtinDigitalLink(p.prefix, ind, ir, s);
  } else if (p.type === 'wip') {
    const pr = p.partRef!, cs = p.cpiSerial!;
    urn = `urn:thingdaddy:${p.ns}:wip:${cs}`;
    elementString = buildCpiElementString(p.prefix, pr, cs);
    epcUri = buildCpiUri(p.prefix, pr, cs);
    epcTagUri = buildCpiTagUri(p.prefix, pr, cs, 0, 96);
    digitalLinkUri = buildCpiDigitalLink(p.prefix, pr, cs);
  } else if (p.type === 'fixed') {
    const ar = p.assetRef!;
    urn = `urn:thingdaddy:${p.ns}:fixed:${ar}`;
    elementString = buildGiaiElementString(p.prefix, ar);
    epcUri = buildGiaiUri(p.prefix, ar);
    epcTagUri = buildGiaiTagUri(p.prefix, ar, 0, 96);
    digitalLinkUri = buildGiaiDigitalLink(p.prefix, ar);
  } else {
    const sr = p.serviceRef!;
    urn = `urn:thingdaddy:${p.ns}:human:${sr}`;
    elementString = buildGsrnElementString(p.prefix, sr);
    epcUri = buildGsrnUri(p.prefix, sr);
    epcTagUri = buildGsrnTagUri(p.prefix, sr, 0);
    digitalLinkUri = buildGsrnDigitalLink(p.prefix, sr);
  }

  return {
    id: p.id, orgId: p.orgId, gs1CompanyPrefix: p.prefix, namespace: p.ns,
    urn, epcUri, epcTagUri, elementString, rfid: encodeToHex(epcTagUri), digitalLinkUri,
    type: p.type, description: p.desc, status: p.status ?? 'active', createdAt: p.date,
  };
}

// ─── Milesight IoT Seed Assets ───────────────────────────
const MS = { orgId: SEED_ORG_IDS.milesight, prefix: '6922927', ns: 'milesight' };

const MILESIGHT_ASSETS: Asset[] = [
  // ── Consumables (SGTIN) — IAQ Sensors ──
  buildSeedAsset({ ...MS, id: 'ast_ms_01', type: 'consumable', itemRef: '10201', serial: 'AM102-2025-00001', desc: 'AM102 2-in-1 IAQ Sensor (Temp + Humidity)', date: '2025-01-10T08:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_02', type: 'consumable', itemRef: '10301', serial: 'AM103-2025-00001', desc: 'AM103 3-in-1 IAQ Sensor (Temp + Humidity + CO2)', date: '2025-01-15T09:30:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_03', type: 'consumable', itemRef: '30701', serial: 'AM307-2025-00001', desc: 'AM307 7-in-1 IAQ Sensor with E-Ink Display', date: '2025-01-20T10:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_04', type: 'consumable', itemRef: '31901', serial: 'AM319-2025-00001', desc: 'AM319 9-in-1 IAQ Sensor (CO2/TVOC/PM2.5/HCHO/O3/Light/PIR)', date: '2025-02-01T11:00:00Z' }),
  // ── People Sensing ──
  buildSeedAsset({ ...MS, id: 'ast_ms_05', type: 'consumable', itemRef: '12101', serial: '100001', desc: 'VS121 AI Workplace Occupancy Sensor', date: '2025-02-10T08:30:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_06', type: 'consumable', itemRef: '12501', serial: '100002', desc: 'VS125 AI Stereo Vision People Counter', date: '2025-02-15T14:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_07', type: 'consumable', itemRef: '13301', serial: 'VS133-2025-00001', desc: 'VS133 AI ToF People Counting Sensor', date: '2025-03-01T09:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_08', type: 'consumable', itemRef: '33001', serial: '100003', desc: 'VS330 Bathroom Occupancy Sensor', date: '2025-03-10T10:15:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_09', type: 'consumable', itemRef: '34001', serial: '100004', desc: 'VS340 Desk Occupancy Sensor', date: '2025-03-15T11:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_10', type: 'consumable', itemRef: '37001', serial: 'VS370-2025-00001', desc: 'VS370 Radar Human Presence Sensor', date: '2025-03-20T12:30:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_11', type: 'consumable', itemRef: '37301', serial: 'VS373-2025-00001', desc: 'VS373 Radar Fall Detection Sensor', date: '2025-04-01T08:00:00Z' }),
  // ── Temperature & Humidity ──
  buildSeedAsset({ ...MS, id: 'ast_ms_12', type: 'consumable', itemRef: '30011', serial: 'EM300TH-2025-00001', desc: 'EM300-TH Temperature & Humidity Sensor (IP67)', date: '2025-04-05T09:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_13', type: 'consumable', itemRef: '32011', serial: '100005', desc: 'EM320-TH Compact Temperature & Humidity Sensor', date: '2025-04-10T10:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_14', type: 'consumable', itemRef: '53011', serial: 'TS301-2025-00001', desc: 'TS301 LoRaWAN Temperature Sensor (External Probe)', date: '2025-04-15T11:00:00Z' }),
  // ── Outdoor / Industrial ──
  buildSeedAsset({ ...MS, id: 'ast_ms_15', type: 'consumable', itemRef: '50011', serial: 'EM500CO2-2025-00001', desc: 'EM500-CO2 Outdoor CO2 Sensor (NDIR, IP66)', date: '2025-04-20T08:30:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_16', type: 'consumable', itemRef: '50021', serial: '100006', desc: 'EM500-LGT Outdoor Light Sensor (0-200klux)', date: '2025-05-01T09:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_17', type: 'consumable', itemRef: '50031', serial: 'EM500PP-2025-00001', desc: 'EM500-PP Pipe Pressure Sensor (0-600bar)', date: '2025-05-10T10:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_18', type: 'consumable', itemRef: '50041', serial: 'EM500SWL-2025-00001', desc: 'EM500-SWL Submersible Water Level Sensor', date: '2025-05-15T11:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_19', type: 'consumable', itemRef: '50051', serial: '100007', desc: 'EM500-SMTC Soil Moisture, Temperature & Conductivity Sensor', date: '2025-05-20T14:00:00Z' }),
  // ── Distance / Level ──
  buildSeedAsset({ ...MS, id: 'ast_ms_20', type: 'consumable', itemRef: '40011', serial: 'EM400TLD-2025-00001', desc: 'EM400-TLD ToF Laser Distance Sensor', date: '2025-06-01T08:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_21', type: 'consumable', itemRef: '40021', serial: '100008', desc: 'EM400-UDL Ultrasonic Distance/Level Sensor', date: '2025-06-10T09:00:00Z' }),
  // ── Smart Thermostat ──
  buildSeedAsset({ ...MS, id: 'ast_ms_22', type: 'consumable', itemRef: '71011', serial: 'WT10x-2025-00001', desc: 'WT10x Smart Radiator Thermostat (TRV)', date: '2025-06-15T10:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_23', type: 'consumable', itemRef: '72011', serial: '100009', desc: 'WT201 Smart Thermostat (HVAC)', date: '2025-06-20T11:00:00Z' }),
  // ── Smart Office / Building ──
  buildSeedAsset({ ...MS, id: 'ast_ms_24', type: 'consumable', itemRef: '81011', serial: 'WS101-2025-00001', desc: 'WS101 LoRaWAN Smart Button (SOS/Service Call)', date: '2025-07-01T08:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_25', type: 'consumable', itemRef: '83011', serial: 'WS301-2025-00001', desc: 'WS301 Magnetic Contact Switch (Door/Window)', date: '2025-07-05T09:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_26', type: 'consumable', itemRef: '83021', serial: '100010', desc: 'WS302 Sound Level Sensor (Noise Monitor)', date: '2025-07-10T10:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_27', type: 'consumable', itemRef: '63011', serial: 'GS301-2025-00001', desc: 'GS301 Bathroom Odor Detector', date: '2025-07-15T11:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_28', type: 'consumable', itemRef: '66011', serial: 'GS601-2025-00001', desc: 'GS601 Vape Detector (Smoking/THC)', date: '2025-07-20T08:00:00Z' }),
  // ── Energy / Display / Tracker ──
  buildSeedAsset({ ...MS, id: 'ast_ms_29', type: 'consumable', itemRef: '91011', serial: '100011', desc: 'CT101 Smart Current Transformer (1-phase)', date: '2025-08-01T09:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_30', type: 'consumable', itemRef: '36041', serial: 'DS3604-2025-00001', desc: 'DS3604 LoRaWAN IoT E-Ink Display (7.5")', date: '2025-08-10T10:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_31', type: 'consumable', itemRef: '21011', serial: 'AT101-2025-00001', desc: 'AT101 Outdoor Asset Tracker (GPS+BLE+LoRa)', date: '2025-08-15T11:00:00Z' }),
  // ── Suspended / Retired consumables for variety ──
  buildSeedAsset({ ...MS, id: 'ast_ms_32', type: 'consumable', itemRef: '10301', serial: 'AM103-2024-00099', desc: 'AM103 IAQ Sensor (RMA unit)', status: 'suspended', date: '2025-02-20T09:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_33', type: 'consumable', itemRef: '12101', serial: '99001', desc: 'VS121 People Counter (EOL prototype)', status: 'retired', date: '2025-01-05T10:00:00Z' }),

  // ── Work in Progress (CPI) — Sub-assemblies ──
  buildSeedAsset({ ...MS, id: 'ast_ms_34', type: 'wip', partRef: '10101001', cpiSerial: '50001', desc: 'SX1302 LoRa Concentrator Module (for UG67)', date: '2025-06-10T07:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_35', type: 'wip', partRef: '10101002', cpiSerial: '50002', desc: 'NDIR CO2 Sensor Module (for AM307/EM500-CO2)', date: '2025-06-15T07:30:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_36', type: 'wip', partRef: '10101003', cpiSerial: '50003', desc: 'ToF Ranging Module (for VS133/EM400-TLD)', date: '2025-07-01T08:00:00Z' }),

  // ── Fixed Assets (GIAI) — Installed infrastructure (numeric refs for GIAI-96) ──
  buildSeedAsset({ ...MS, id: 'ast_ms_37', type: 'fixed', assetRef: '100301', desc: 'UG65 Indoor LoRaWAN Gateway — Building A Floor 3', date: '2025-03-01T06:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_38', type: 'fixed', assetRef: '200101', desc: 'UG67 Outdoor LoRaWAN Gateway — Rooftop Site Alpha', date: '2025-03-05T06:30:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_39', type: 'fixed', assetRef: '300701', desc: 'SG50 Solar LoRaWAN Gateway — Farm Site 7', date: '2025-04-01T06:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_40', type: 'fixed', assetRef: '400201', desc: 'UC300 LoRaWAN & 4G IoT Controller — Factory Line 2', date: '2025-05-01T07:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_41', type: 'fixed', assetRef: '500101', desc: 'UC100 Modbus-to-LoRaWAN Converter — Chiller Room', date: '2025-06-01T07:00:00Z' }),

  // ── Human Resources (GSRN) — Staff badges ──
  buildSeedAsset({ ...MS, id: 'ast_ms_42', type: 'human', serviceRef: '1000000001', desc: 'Li Wei — VP of IoT Products', date: '2025-03-15T06:00:00Z' }),
  buildSeedAsset({ ...MS, id: 'ast_ms_43', type: 'human', serviceRef: '1000000002', desc: 'Zhang Min — QA Engineer, Sensor Division', date: '2025-03-20T06:00:00Z' }),
].map((a) => {
  // Apply per-type warranty activation defaults for the Milesight demo
  if (a.type === 'fixed') {
    return { ...a, warrantyActivationMode: 'auto_first_scan' as const, warrantyPeriodMonths: 24 };
  }
  if (a.type === 'consumable') {
    return { ...a, warrantyActivationMode: 'manual' as const, warrantyPeriodMonths: 12 };
  }
  if (a.type === 'wip') {
    return {
      ...a,
      warrantyActivationMode: 'auto_immediate' as const,
      warrantyPeriodMonths: 36,
      warrantyStartDate: a.createdAt,
      warrantyActivatedAt: a.createdAt,
      warrantyActivatedBy: 'system',
    };
  }
  return { ...a, warrantyActivationMode: 'owner_only' as const, warrantyPeriodMonths: null };
});

const SEED_ASSETS: Asset[] = [
  // ── Acme Corporation (0614141) — 2 things ──
  {
    id: 'ast_seed_01', orgId: SEED_ORG_IDS.acme, gs1CompanyPrefix: '0614141',
    namespace: 'acme', urn: 'urn:thingdaddy:acme:consumable:7654',
    epcUri: 'urn:epc:id:sgtin:0614141.035001.7654', epcTagUri: 'urn:epc:tag:sgtin-96:0.0614141.035001.7654',
    elementString: '(01) 00614141350018 (21) 7654', rfid: '3014257BF4222E4000001DE6',
    type: 'consumable', status: 'active', description: 'Acme Widget Batch Alpha', createdAt: '2025-12-01T09:00:00.000Z',
  },
  {
    id: 'ast_seed_05', orgId: SEED_ORG_IDS.acme, gs1CompanyPrefix: '0614141',
    namespace: 'acme', urn: 'urn:thingdaddy:acme:fixed:32',
    epcUri: 'urn:epc:id:giai:0614141.32', epcTagUri: 'urn:epc:tag:giai-96:0.0614141.32',
    elementString: '(8004) 061414132', rfid: '3414257BF40000000000020',
    type: 'fixed', status: 'active', description: 'CNC Milling Machine - Bay 3', createdAt: '2025-08-05T16:00:00.000Z',
  },
  // ── CP Group Thailand (8850002) — 3 things ──
  {
    id: 'ast_seed_02', orgId: SEED_ORG_IDS.cpgroup, gs1CompanyPrefix: '8850002',
    namespace: 'cpgroup', urn: 'urn:thingdaddy:cpgroup:consumable:999',
    epcUri: 'urn:epc:id:sgtin:8850002.350010.999', epcTagUri: 'urn:epc:tag:sgtin-96:0.8850002.350010.999',
    elementString: '(01) 38850002500108 (21) 999', rfid: '301521C7D555CE80000003E7',
    type: 'consumable', status: 'active', description: 'CP Ready Meal Packaging', createdAt: '2025-11-15T14:30:00.000Z',
  },
  {
    id: 'ast_seed_03', orgId: SEED_ORG_IDS.cpgroup, gs1CompanyPrefix: '8850002',
    namespace: 'cpgroup', urn: 'urn:thingdaddy:cpgroup:wip:12345',
    epcUri: 'urn:epc:id:cpi:8850002.999.12345', epcTagUri: 'urn:epc:tag:cpi-96:0.8850002.999.12345',
    elementString: '(8010) 8850002999 (8011) 12345', rfid: '3C1521C7D800001F380003039',
    type: 'wip', status: 'active', description: 'Shrimp feed pellet batch assembly', createdAt: '2025-10-20T08:15:00.000Z',
  },
  {
    id: 'ast_seed_09', orgId: SEED_ORG_IDS.cpgroup, gs1CompanyPrefix: '8850002',
    namespace: 'cpgroup', urn: 'urn:thingdaddy:cpgroup:consumable:1001',
    epcUri: 'urn:epc:id:sgtin:8850002.350020.1001', epcTagUri: 'urn:epc:tag:sgtin-96:0.8850002.350020.1001',
    elementString: '(01) 38850002500207 (21) 1001', rfid: '301521C7D555CF000000003E9',
    type: 'consumable', status: 'suspended', description: 'CP Frozen Dumpling Box', createdAt: '2025-09-10T11:45:00.000Z',
  },
  // ── ThingDaddy Demo (8858718) — 3 things ──
  {
    id: 'ast_seed_06', orgId: SEED_ORG_IDS.thingdaddy, gs1CompanyPrefix: '8858718',
    namespace: 'thingdaddy', urn: 'urn:thingdaddy:thingdaddy:consumable:5001',
    epcUri: 'urn:epc:id:sgtin:8858718.010050.5001', epcTagUri: 'urn:epc:tag:sgtin-96:0.8858718.010050.5001',
    elementString: '(01) 88587180100501 (21) 5001', rfid: '301521EBC440A0640000001389',
    type: 'consumable', status: 'active', description: 'ThingDaddy Demo Sensor Kit', createdAt: '2025-07-22T10:30:00.000Z',
  },
  {
    id: 'ast_seed_07', orgId: SEED_ORG_IDS.thingdaddy, gs1CompanyPrefix: '8858718',
    namespace: 'thingdaddy', urn: 'urn:thingdaddy:thingdaddy:human:1234567890',
    epcUri: 'urn:epc:id:gsrn:8858718.1234567890', epcTagUri: 'urn:epc:tag:gsrn-96:0.8858718.1234567890',
    elementString: '(8018) 885871812345678906', rfid: '2D1521EBC4499602D2000000',
    type: 'human', status: 'active', description: 'Employee badge — S. Patel', createdAt: '2025-06-18T07:00:00.000Z',
  },
  {
    id: 'ast_seed_08', orgId: SEED_ORG_IDS.thingdaddy, gs1CompanyPrefix: '8858718',
    namespace: 'thingdaddy', urn: 'urn:thingdaddy:thingdaddy:human:9876543210',
    epcUri: 'urn:epc:id:gsrn:8858718.9876543210', epcTagUri: 'urn:epc:tag:gsrn-96:0.8858718.9876543210',
    elementString: '(8018) 885871898765432107', rfid: '2D1521EBC64CB016EA000000',
    type: 'human', status: 'retired', description: 'Access card — former contractor', createdAt: '2025-05-30T13:20:00.000Z',
  },
  // ── Milesight IoT (6922927) — 43 things ──
  ...MILESIGHT_ASSETS,
];

const SEED_TRANSFERS: Transfer[] = [
  {
    id: 'txfr_seed_01', thingId: 'ast_seed_06', fromOrgId: SEED_ORG_IDS.thingdaddy, toOrgId: SEED_ORG_IDS.cpgroup,
    status: 'pending', note: 'Demo sensor kit loan to CP Group', initiatedAt: '2025-12-15T09:00:00Z',
  },
  {
    id: 'txfr_seed_02', thingId: 'ast_seed_01', fromOrgId: SEED_ORG_IDS.acme, toOrgId: SEED_ORG_IDS.cpgroup,
    status: 'completed', note: 'Widget supply chain partnership', initiatedAt: '2025-11-01T10:00:00Z', completedAt: '2025-11-02T14:00:00Z',
  },
  {
    id: 'txfr_seed_03', thingId: 'ast_ms_31', fromOrgId: SEED_ORG_IDS.milesight, toOrgId: SEED_ORG_IDS.thingdaddy,
    status: 'pending', note: 'AT101 GPS tracker evaluation unit for ThingDaddy', initiatedAt: '2025-12-20T09:00:00Z',
  },
  {
    id: 'txfr_seed_04', thingId: 'ast_ms_38', fromOrgId: SEED_ORG_IDS.milesight, toOrgId: SEED_ORG_IDS.cpgroup,
    status: 'completed', note: 'UG67 outdoor gateway for CP Group smart farm', initiatedAt: '2025-11-15T10:00:00Z', completedAt: '2025-11-16T14:00:00Z',
  },
];

function buildSeedAuditLogs(): AuditLogEntry[] {
  const logs: AuditLogEntry[] = [];
  let seq = 1;
  for (const a of SEED_ASSETS) {
    logs.push({
      id: `audit_seed_${String(seq++).padStart(3, '0')}`,
      timestamp: a.createdAt,
      action: 'created',
      thingId: a.id,
      thingName: a.namespace,
      userId: 'admin',
      orgId: a.orgId,
      details: { type: a.type, companyPrefix: a.gs1CompanyPrefix },
    });
  }
  // Some update/status events
  logs.push({
    id: `audit_seed_${String(seq++).padStart(3, '0')}`, timestamp: '2025-09-15T10:00:00Z',
    action: 'status_changed', thingId: 'ast_seed_09', thingName: 'cpgroup',
    userId: 'admin', orgId: SEED_ORG_IDS.cpgroup, details: { from: 'active', to: 'suspended' },
  });
  logs.push({
    id: `audit_seed_${String(seq++).padStart(3, '0')}`, timestamp: '2025-06-01T12:00:00Z',
    action: 'status_changed', thingId: 'ast_seed_08', thingName: 'thingdaddy',
    userId: 'admin', orgId: SEED_ORG_IDS.thingdaddy, details: { from: 'active', to: 'retired' },
  });
  logs.push({
    id: `audit_seed_${String(seq++).padStart(3, '0')}`, timestamp: '2025-11-02T14:00:00Z',
    action: 'transferred', thingId: 'ast_seed_01', thingName: 'acme',
    userId: 'admin', orgId: SEED_ORG_IDS.cpgroup, details: { fromOrg: 'Acme Corporation', toOrg: 'CP Group Thailand', transferId: 'txfr_seed_02' },
  });
  logs.push({
    id: `audit_seed_${String(seq++).padStart(3, '0')}`, timestamp: '2025-10-25T09:30:00Z',
    action: 'updated', thingId: 'ast_seed_03', thingName: 'cpgroup',
    userId: 'admin', orgId: SEED_ORG_IDS.cpgroup, details: { field: 'description', oldValue: 'Shrimp feed batch', newValue: 'Shrimp feed pellet batch assembly' },
  });
  logs.push({
    id: `audit_seed_${String(seq++).padStart(3, '0')}`, timestamp: '2025-08-10T11:00:00Z',
    action: 'updated', thingId: 'ast_seed_05', thingName: 'acme',
    userId: 'admin', orgId: SEED_ORG_IDS.acme, details: { field: 'description', oldValue: 'CNC Machine', newValue: 'CNC Milling Machine - Bay 3' },
  });
  // Milesight transfer audit
  logs.push({
    id: `audit_seed_${String(seq++).padStart(3, '0')}`, timestamp: '2025-11-16T14:00:00Z',
    action: 'transferred', thingId: 'ast_ms_38', thingName: 'milesight',
    userId: 'admin', orgId: SEED_ORG_IDS.cpgroup, details: { fromOrg: 'Milesight IoT', toOrg: 'CP Group Thailand', transferId: 'txfr_seed_04' },
  });
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ─── localStorage Keys ───────────────────────────────────

const ASSETS_KEY = 'mock_assets';
const ORGS_KEY = 'mock_orgs';
const TRANSFERS_KEY = 'mock_transfers';
const AUDIT_KEY = 'mock_audit_logs';
const SEED_VERSION_KEY = 'mock_seed_version';
const CURRENT_SEED_VERSION = '4.0'; // bump when seed data changes

function checkSeedVersion(): void {
  if (typeof window === 'undefined') return;
  const stored = localStorage.getItem(SEED_VERSION_KEY);
  if (stored !== CURRENT_SEED_VERSION) {
    localStorage.removeItem(ASSETS_KEY);
    localStorage.removeItem(ORGS_KEY);
    localStorage.removeItem(TRANSFERS_KEY);
    localStorage.removeItem(AUDIT_KEY);
    localStorage.removeItem('mock_users');
    localStorage.removeItem('mock_current_user');
    localStorage.removeItem('warranty_claims');
    localStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION);
  }
}

function seedStore<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  checkSeedVersion();
  const stored = localStorage.getItem(key);
  if (!stored || stored === '[]') {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

function getStore<T>(key: string, seedData?: T[]): T[] {
  if (typeof window === 'undefined') return [];
  if (seedData) seedStore(key, seedData);
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  try { return JSON.parse(stored); } catch { return []; }
}

function setStore<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Database ────────────────────────────────────────────

export const mockDb = {
  // ── Organizations ──
  getAllOrgs: (): Organization[] => getStore<Organization>(ORGS_KEY, SEED_ORGS),

  getOrgById: (id: string): Organization | undefined =>
    mockDb.getAllOrgs().find(o => o.id === id),

  getOrgByPrefix: (prefix: string): Organization | undefined =>
    mockDb.getAllOrgs().find(o => o.companyPrefix === prefix),

  createOrg: (org: Omit<Organization, 'id' | 'createdAt'>): Organization => {
    const newOrg: Organization = { ...org, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const all = mockDb.getAllOrgs();
    setStore(ORGS_KEY, [newOrg, ...all]);
    return newOrg;
  },

  updateOrg: (id: string, updates: Partial<Organization>): Organization | undefined => {
    const all = mockDb.getAllOrgs();
    const i = all.findIndex(o => o.id === id);
    if (i === -1) return undefined;
    const next = { ...all[i], ...updates };
    all[i] = next;
    setStore(ORGS_KEY, all);
    return next;
  },

  deleteOrg: (id: string): boolean => {
    const all = mockDb.getAllOrgs();
    const next = all.filter(o => o.id !== id);
    if (next.length === all.length) return false;
    setStore(ORGS_KEY, next);
    return true;
  },

  deleteAssetsByOrg: (orgId: string): number => {
    const all = mockDb.getAssets();
    const next = all.filter(a => a.orgId !== orgId);
    setStore(ASSETS_KEY, next);
    return all.length - next.length;
  },

  // ── Legacy Company compat ──
  getCompanies: (): Company[] => MOCK_COMPANIES,
  getCompany: (id: string): Company | undefined => MOCK_COMPANIES.find(c => c.id === id),

  // ── Assets ──
  getAsset: (id: string): Asset | undefined => mockDb.getAssets().find(a => a.id === id),

  getAssets: (orgId?: string): Asset[] => {
    const all = getStore<Asset>(ASSETS_KEY, SEED_ASSETS);
    if (orgId) return all.filter(a => a.orgId === orgId);
    return all;
  },

  saveAsset: (newAsset: Asset): void => {
    const existing = mockDb.getAssets();
    setStore(ASSETS_KEY, [newAsset, ...existing]);
    mockDb.addAuditLog({
      action: 'created', thingId: newAsset.id, thingName: newAsset.namespace,
      userId: 'admin', orgId: newAsset.orgId,
      details: { type: newAsset.type, companyPrefix: newAsset.gs1CompanyPrefix },
    });
  },

  updateAsset: (id: string, updates: Partial<Asset>): void => {
    const existing = mockDb.getAssets();
    const index = existing.findIndex(a => a.id === id);
    if (index === -1) return;
    const old = existing[index];
    existing[index] = { ...old, ...updates };
    setStore(ASSETS_KEY, existing);
    // Audit: figure out what changed
    const changedFields = Object.keys(updates).filter(
      k => k !== 'id' && (old as any)[k] !== (updates as any)[k]
    );
    if (changedFields.length > 0) {
      mockDb.addAuditLog({
        action: 'updated', thingId: id, thingName: old.namespace,
        userId: 'admin', orgId: old.orgId,
        details: Object.fromEntries(changedFields.map(k => [k, { old: (old as any)[k], new: (updates as any)[k] }])),
      });
    }
  },

  updateAssetStatus: (id: string, newStatus: AssetStatus): void => {
    const asset = mockDb.getAsset(id);
    if (!asset) return;
    const oldStatus = asset.status || 'active';
    mockDb.updateAsset(id, { status: newStatus });
    // Override the generic 'updated' audit with a specific 'status_changed'
    const logs = mockDb.getAuditLogs();
    // Remove the generic 'updated' we just added and replace with status_changed
    const filtered = logs.filter(l => !(l.thingId === id && l.action === 'updated' && l.timestamp === logs[0]?.timestamp));
    setStore(AUDIT_KEY, filtered);
    mockDb.addAuditLog({
      action: 'status_changed', thingId: id, thingName: asset.namespace,
      userId: 'admin', orgId: asset.orgId,
      details: { from: oldStatus, to: newStatus },
    });
  },

  deleteAsset: (id: string): boolean => {
    const existing = mockDb.getAssets();
    const asset = existing.find(a => a.id === id);
    const filtered = existing.filter(a => a.id !== id);
    if (filtered.length === existing.length) return false;
    setStore(ASSETS_KEY, filtered);
    if (asset) {
      mockDb.addAuditLog({
        action: 'deleted', thingId: id, thingName: asset.namespace,
        userId: 'admin', orgId: asset.orgId,
        details: { type: asset.type, lastUrn: asset.urn },
      });
    }
    return true;
  },

  getThingStats: (orgId?: string): { total: number; active: number; suspended: number; retired: number } => {
    const assets = mockDb.getAssets(orgId);
    let active = 0, suspended = 0, retired = 0;
    for (const a of assets) {
      const s = a.status || 'active';
      if (s === 'active') active++;
      else if (s === 'suspended') suspended++;
      else if (s === 'retired') retired++;
    }
    return { total: assets.length, active, suspended, retired };
  },

  clearAssets: (): void => { if (typeof window !== 'undefined') localStorage.removeItem(ASSETS_KEY); },

  // ── Transfers ──
  getTransfers: (filters?: { status?: string; orgId?: string }): Transfer[] => {
    let transfers = getStore<Transfer>(TRANSFERS_KEY, SEED_TRANSFERS);
    if (filters?.status) transfers = transfers.filter(t => t.status === filters.status);
    if (filters?.orgId) transfers = transfers.filter(t => t.fromOrgId === filters.orgId || t.toOrgId === filters.orgId);
    return transfers;
  },

  createTransfer: (data: { thingId: string; fromOrgId: string; toOrgId: string; note?: string }): Transfer => {
    const transfer: Transfer = {
      id: crypto.randomUUID(), ...data,
      status: 'pending', initiatedAt: new Date().toISOString(),
    };
    const all = mockDb.getTransfers();
    setStore(TRANSFERS_KEY, [transfer, ...all]);
    return transfer;
  },

  acceptTransfer: (transferId: string): Transfer | null => {
    const all = getStore<Transfer>(TRANSFERS_KEY, SEED_TRANSFERS);
    const idx = all.findIndex(t => t.id === transferId);
    if (idx === -1 || all[idx].status !== 'pending') return null;
    all[idx] = { ...all[idx], status: 'completed', completedAt: new Date().toISOString() };
    setStore(TRANSFERS_KEY, all);
    // Move thing to new org
    const t = all[idx];
    mockDb.updateAsset(t.thingId, { orgId: t.toOrgId });
    const fromOrg = mockDb.getOrgById(t.fromOrgId);
    const toOrg = mockDb.getOrgById(t.toOrgId);
    mockDb.addAuditLog({
      action: 'transferred', thingId: t.thingId,
      thingName: mockDb.getAsset(t.thingId)?.namespace,
      userId: 'admin', orgId: t.toOrgId,
      details: { fromOrg: fromOrg?.name, toOrg: toOrg?.name, transferId },
    });
    return all[idx];
  },

  rejectTransfer: (transferId: string): Transfer | null => {
    const all = getStore<Transfer>(TRANSFERS_KEY, SEED_TRANSFERS);
    const idx = all.findIndex(t => t.id === transferId);
    if (idx === -1 || all[idx].status !== 'pending') return null;
    all[idx] = { ...all[idx], status: 'rejected', completedAt: new Date().toISOString() };
    setStore(TRANSFERS_KEY, all);
    return all[idx];
  },

  // ── Audit Log ──
  getAuditLogs: (filters?: { thingId?: string; action?: string; orgId?: string; limit?: number }): AuditLogEntry[] => {
    let logs = getStore<AuditLogEntry>(AUDIT_KEY, buildSeedAuditLogs());
    if (filters?.orgId) logs = logs.filter(l => l.orgId === filters.orgId);
    if (filters?.thingId) logs = logs.filter(l => l.thingId === filters.thingId);
    if (filters?.action) logs = logs.filter(l => l.action === filters.action);
    if (filters?.limit) logs = logs.slice(0, filters.limit);
    return logs;
  },

  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry => {
    const log: AuditLogEntry = { ...entry, id: crypto.randomUUID(), timestamp: new Date().toISOString() };
    const all = mockDb.getAuditLogs();
    setStore(AUDIT_KEY, [log, ...all]);
    return log;
  },
};
