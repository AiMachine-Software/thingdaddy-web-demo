// ─── Types ───────────────────────────────────────────────

export type ContractStatus = 'active' | 'paused' | 'terminated' | 'completed'

export interface Contract {
  id: string
  negotiationId?: string
  orgId: string
  buyerThingId: string
  sellerThingId: string
  capabilityId: string
  capabilityName: string
  capabilityIcon: string
  agreedPrice: number
  unit: string
  durationLabel: string
  startedAt: string
  endsAt?: string
  status: ContractStatus
  deliveredUnits: number
  costAccrued: number
  uptimePct: number
}

// ─── Storage ─────────────────────────────────────────────

const STORAGE_KEY = 'thingdaddy.economy.contracts.v1'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function loadAll(): Contract[] {
  if (!isBrowser()) return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Contract[]
  } catch {
    return []
  }
}

function saveAll(list: Contract[]): void {
  if (!isBrowser()) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function newId(): string {
  if (isBrowser() && typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `ct_${crypto.randomUUID().slice(0, 12)}`
  }
  return `ct_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

// ─── API ─────────────────────────────────────────────────

export interface CreateContractInput {
  negotiationId?: string
  orgId: string
  buyerThingId: string
  sellerThingId: string
  capabilityId: string
  capabilityName: string
  capabilityIcon: string
  agreedPrice: number
  unit: string
  durationLabel?: string
  startedAt?: string
  endsAt?: string
  deliveredUnits?: number
  costAccrued?: number
  uptimePct?: number
  status?: ContractStatus
}

export function createContract(input: CreateContractInput): Contract {
  const contract: Contract = {
    id: newId(),
    negotiationId: input.negotiationId,
    orgId: input.orgId,
    buyerThingId: input.buyerThingId,
    sellerThingId: input.sellerThingId,
    capabilityId: input.capabilityId,
    capabilityName: input.capabilityName,
    capabilityIcon: input.capabilityIcon,
    agreedPrice: input.agreedPrice,
    unit: input.unit,
    durationLabel: input.durationLabel ?? '7 days',
    startedAt: input.startedAt ?? new Date().toISOString(),
    endsAt: input.endsAt,
    status: input.status ?? 'active',
    deliveredUnits: input.deliveredUnits ?? 0,
    costAccrued: input.costAccrued ?? 0,
    uptimePct: input.uptimePct ?? 99.5,
  }
  saveAll([contract, ...loadAll()])
  return contract
}

export function updateContract(id: string, updates: Partial<Contract>): Contract | undefined {
  const all = loadAll()
  const i = all.findIndex((c) => c.id === id)
  if (i === -1) return undefined
  const next = { ...all[i], ...updates, id: all[i].id }
  all[i] = next
  saveAll(all)
  return next
}

export function deleteContract(id: string): boolean {
  const all = loadAll()
  const next = all.filter((c) => c.id !== id)
  if (next.length === all.length) return false
  saveAll(next)
  return true
}

export function listContracts(orgId?: string): Contract[] {
  let all = loadAll()
  if (orgId) all = all.filter((c) => c.orgId === orgId)
  return [...all].sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}

export function getContract(id: string): Contract | undefined {
  return loadAll().find((c) => c.id === id)
}

export function getContractsForThing(thingId: string): Contract[] {
  return loadAll().filter((c) => c.buyerThingId === thingId || c.sellerThingId === thingId)
}

export function getActiveContractsForOrg(orgId: string): Contract[] {
  return listContracts(orgId).filter((c) => c.status === 'active')
}

export function pauseContract(id: string): Contract | undefined {
  return updateContract(id, { status: 'paused' })
}

export function resumeContract(id: string): Contract | undefined {
  return updateContract(id, { status: 'active' })
}

export function terminateContract(id: string): Contract | undefined {
  return updateContract(id, { status: 'terminated' })
}

export function completeContract(id: string): Contract | undefined {
  return updateContract(id, { status: 'completed' })
}
