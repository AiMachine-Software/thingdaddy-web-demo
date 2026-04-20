import { mockDb } from './mockDb'

export type WarrantyClaimType = 'manual' | 'auto'
export type WarrantyClaimStatus = 'active' | 'expired' | 'void'

export interface WarrantyClaim {
  id: string
  thingId: string
  claimType: WarrantyClaimType
  consumerName?: string
  consumerEmail?: string
  consumerPhone?: string
  purchaseDate?: string
  purchaseFrom?: string
  receiptNumber?: string
  activatedAt: string
  warrantyStartDate: string
  warrantyEndDate: string
  warrantyPeriodMonths: number
  certificateNumber: string
  status: WarrantyClaimStatus
}

const CLAIMS_KEY = 'warranty_claims'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function loadClaims(): WarrantyClaim[] {
  if (!isBrowser()) return []
  const raw = localStorage.getItem(CLAIMS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as WarrantyClaim[]
  } catch {
    return []
  }
}

export function saveClaims(claims: WarrantyClaim[]): void {
  if (!isBrowser()) return
  localStorage.setItem(CLAIMS_KEY, JSON.stringify(claims))
}

export function getClaimsForThing(thingId: string): WarrantyClaim[] {
  return loadClaims().filter((c) => c.thingId === thingId)
}

export function getActiveClaim(thingId: string): WarrantyClaim | undefined {
  return getClaimsForThing(thingId).find((c) => c.status === 'active')
}

function pad4(n: number): string {
  return String(n).padStart(4, '0')
}

export function nextCertificateNumber(now: Date = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `WR-${year}-${month}-`
  const seq =
    loadClaims().filter((c) => c.certificateNumber.startsWith(prefix)).length + 1
  return `${prefix}${pad4(seq)}`
}

function addMonthsIso(iso: string, months: number): string {
  const d = new Date(iso)
  d.setMonth(d.getMonth() + months)
  return d.toISOString()
}

export interface CreateClaimInput {
  thingId: string
  claimType: WarrantyClaimType
  warrantyPeriodMonths: number
  /** Defaults to now */
  warrantyStartDate?: string
  consumerName?: string
  consumerEmail?: string
  consumerPhone?: string
  purchaseDate?: string
  purchaseFrom?: string
  receiptNumber?: string
}

export function createClaim(input: CreateClaimInput): WarrantyClaim {
  const now = new Date()
  const activatedAt = now.toISOString()
  const startDate = input.warrantyStartDate ?? activatedAt
  const endDate = addMonthsIso(startDate, input.warrantyPeriodMonths)
  const claim: WarrantyClaim = {
    id: isBrowser() ? crypto.randomUUID() : `claim_${Date.now()}`,
    thingId: input.thingId,
    claimType: input.claimType,
    consumerName: input.consumerName,
    consumerEmail: input.consumerEmail,
    consumerPhone: input.consumerPhone,
    purchaseDate: input.purchaseDate,
    purchaseFrom: input.purchaseFrom,
    receiptNumber: input.receiptNumber,
    activatedAt,
    warrantyStartDate: startDate,
    warrantyEndDate: endDate,
    warrantyPeriodMonths: input.warrantyPeriodMonths,
    certificateNumber: nextCertificateNumber(now),
    status: 'active',
  }

  saveClaims([claim, ...loadClaims()])

  // Mirror activation onto the Asset so existing warranty derivation
  // (computeWarranty) keeps working.
  mockDb.updateAsset(input.thingId, {
    warrantyStartDate: startDate,
    warrantyEndDate: endDate,
    warrantyActivatedAt: activatedAt,
    warrantyActivatedBy:
      input.claimType === 'auto' ? 'auto' : input.consumerName ?? 'consumer',
  })

  return claim
}
