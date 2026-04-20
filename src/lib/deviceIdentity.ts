import { mockDb, type Asset } from './mockDb'

// ─── Types ───────────────────────────────────────────────

export interface ThingIdentity {
  thingId: string
  did: string
  publicKey: string
  privateKeyHash: string
  keyType: 'Ed25519'
  didDocument: Record<string, unknown>
  createdAt: string
  status: 'active' | 'revoked'
}

// ─── Storage ─────────────────────────────────────────────

const STORAGE_KEY = 'thingdaddy.economy.identities.v1'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function loadMap(): Record<string, ThingIdentity> {
  if (!isBrowser()) return {}
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, ThingIdentity>
  } catch {
    return {}
  }
}

function saveMap(map: Record<string, ThingIdentity>): void {
  if (!isBrowser()) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

// ─── Deterministic demo key generation ──────────────────
// NOT real cryptography. Produces stable, DID-derived strings that look
// like Ed25519 / base58 values for demo UI purposes only.

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function hashCode(input: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

function pseudoBase58(seed: string, length: number): string {
  let state = hashCode(seed)
  let out = ''
  for (let i = 0; i < length; i++) {
    state = Math.imul(state ^ (i + 0x9e3779b9), 2654435761) >>> 0
    out += BASE58[state % BASE58.length]
  }
  return out
}

function hexHash(seed: string): string {
  let h = hashCode(seed)
  let out = ''
  for (let i = 0; i < 16; i++) {
    h = Math.imul(h ^ (i + 0x85ebca6b), 3266489917) >>> 0
    out += h.toString(16).padStart(8, '0').slice(0, 4)
  }
  return out.slice(0, 64)
}

// ─── DID derivation ─────────────────────────────────────

/**
 * Derive a DID from an asset's EPC URI.
 * urn:epc:id:sgtin:6922927.011221.00001  ->  did:thingdaddy:6922927:sgtin:011221:00001
 */
export function deriveDid(asset: Asset): string {
  if (asset.epcUri && asset.epcUri.startsWith('urn:epc:id:')) {
    const rest = asset.epcUri.slice('urn:epc:id:'.length)
    // rest = "sgtin:6922927.011221.00001" or "giai:6922927.ASSET-001" etc.
    const [scheme, body = ''] = rest.split(':')
    const parts = body.split('.')
    return `did:thingdaddy:${[parts[0] ?? '', scheme, ...parts.slice(1)].filter(Boolean).join(':')}`
  }
  // Fallback: derive from URN
  return `did:thingdaddy:${asset.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)}`
}

function buildDidDocument(did: string, publicKey: string, resolverUrl: string): Record<string, unknown> {
  return {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1',
    ],
    id: did,
    verificationMethod: [
      {
        id: `${did}#key-1`,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase: `z${publicKey}`,
      },
    ],
    authentication: [`${did}#key-1`],
    assertionMethod: [`${did}#key-1`],
    service: [
      {
        id: `${did}#resolver`,
        type: 'ThingDaddyResolver',
        serviceEndpoint: resolverUrl,
      },
    ],
  }
}

// ─── Public API ─────────────────────────────────────────

export function getIdentity(thingId: string): ThingIdentity | undefined {
  return loadMap()[thingId]
}

export function ensureIdentity(asset: Asset): ThingIdentity {
  const map = loadMap()
  const existing = map[asset.id]
  if (existing) return existing

  const did = deriveDid(asset)
  const publicKey = pseudoBase58(`pk:${did}`, 44)
  const privateKeyHash = hexHash(`sk:${did}`)
  const resolverUrl = `https://thingdaddy.co.th/thing/${asset.id}`
  const identity: ThingIdentity = {
    thingId: asset.id,
    did,
    publicKey,
    privateKeyHash,
    keyType: 'Ed25519',
    didDocument: buildDidDocument(did, publicKey, resolverUrl),
    createdAt: asset.createdAt ?? new Date().toISOString(),
    status: 'active',
  }
  map[asset.id] = identity
  saveMap(map)
  return identity
}

export function rotateKey(thingId: string): ThingIdentity | undefined {
  const map = loadMap()
  const current = map[thingId]
  if (!current) return undefined
  const entropy = `${Date.now()}-${Math.random()}`
  const publicKey = pseudoBase58(`pk:${current.did}:${entropy}`, 44)
  const privateKeyHash = hexHash(`sk:${current.did}:${entropy}`)
  const resolverUrl = `https://thingdaddy.co.th/thing/${thingId}`
  const next: ThingIdentity = {
    ...current,
    publicKey,
    privateKeyHash,
    didDocument: buildDidDocument(current.did, publicKey, resolverUrl),
    createdAt: new Date().toISOString(),
    status: 'active',
  }
  map[thingId] = next
  saveMap(map)
  return next
}

export function ensureIdentitiesForOrg(orgId: string): void {
  const assets = mockDb.getAssets(orgId)
  const map = loadMap()
  let changed = false
  for (const asset of assets) {
    if (!map[asset.id]) {
      const did = deriveDid(asset)
      const publicKey = pseudoBase58(`pk:${did}`, 44)
      const privateKeyHash = hexHash(`sk:${did}`)
      const resolverUrl = `https://thingdaddy.co.th/thing/${asset.id}`
      map[asset.id] = {
        thingId: asset.id,
        did,
        publicKey,
        privateKeyHash,
        keyType: 'Ed25519',
        didDocument: buildDidDocument(did, publicKey, resolverUrl),
        createdAt: asset.createdAt ?? new Date().toISOString(),
        status: 'active',
      }
      changed = true
    }
  }
  if (changed) saveMap(map)
}

export function getDidFor(thingId: string): string {
  const existing = getIdentity(thingId)
  if (existing) return existing.did
  const asset = mockDb.getAsset(thingId)
  if (!asset) return `did:thingdaddy:unknown:${thingId}`
  return ensureIdentity(asset).did
}
