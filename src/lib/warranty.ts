import type { Asset } from './mockDb'
import { mockDb } from './mockDb'
import { createClaim, getActiveClaim } from './warrantyClaims'

export type WarrantyStatus =
  | 'active'
  | 'expiring'
  | 'expired'
  | 'void'
  | 'none'
  | 'pending'
  | 'awaiting_registration'

export const EXPIRING_SOON_DAYS = 30

export interface WarrantyView {
  startDate: string
  endDate: string | null
  periodMonths: number | null
  status: WarrantyStatus
  notes: string
  derived: boolean
}

/**
 * Default warranty period (months) for legacy seed assets that pre-date the
 * warranty fields. Mirrors the prompt: gateways=24mo, sensors=12mo, controllers=36mo,
 * GSRN=null.
 */
export function defaultWarrantyMonths(asset: Asset): number | null {
  switch (asset.type) {
    case 'fixed':
      return 24
    case 'consumable':
      return 12
    case 'wip':
      return 36
    case 'human':
      return null
    default:
      return null
  }
}

function addMonthsIso(iso: string, months: number): string {
  const d = new Date(iso)
  d.setMonth(d.getMonth() + months)
  return d.toISOString()
}

export function computeWarranty(asset: Asset): WarrantyView {
  const startDate = asset.warrantyStartDate ?? asset.createdAt
  const notes = asset.warrantyNotes ?? ''
  const activationMode = asset.warrantyActivationMode

  // Manually voided overrides everything else
  if (asset.warrantyVoid) {
    const periodMonths = asset.warrantyPeriodMonths ?? null
    const endDate =
      asset.warrantyEndDate ??
      (periodMonths != null ? addMonthsIso(startDate, periodMonths) : null)
    return {
      startDate,
      endDate,
      periodMonths,
      status: 'void',
      notes,
      derived: false,
    }
  }

  // Manual mode awaiting consumer registration
  if (activationMode === 'manual' && !asset.warrantyStartDate) {
    const periodMonths =
      asset.warrantyPeriodMonths ?? defaultWarrantyMonths(asset)
    return {
      startDate,
      endDate: null,
      periodMonths,
      status: 'awaiting_registration',
      notes,
      derived: asset.warrantyPeriodMonths == null,
    }
  }

  // Auto-on-first-scan, not yet activated
  if (activationMode === 'auto_first_scan' && !asset.warrantyStartDate) {
    const periodMonths =
      asset.warrantyPeriodMonths ?? defaultWarrantyMonths(asset)
    return {
      startDate,
      endDate: null,
      periodMonths,
      status: 'pending',
      notes,
      derived: asset.warrantyPeriodMonths == null,
    }
  }

  // Stored values take priority
  if (asset.warrantyPeriodMonths != null || asset.warrantyEndDate != null) {
    const periodMonths = asset.warrantyPeriodMonths ?? null
    const endDate =
      asset.warrantyEndDate ??
      (periodMonths != null ? addMonthsIso(startDate, periodMonths) : null)
    return {
      startDate,
      endDate,
      periodMonths,
      status: deriveStatus(endDate),
      notes,
      derived: false,
    }
  }

  // Derive default for legacy seed assets
  const months = defaultWarrantyMonths(asset)
  if (months == null) {
    return {
      startDate,
      endDate: null,
      periodMonths: null,
      status: 'none',
      notes,
      derived: true,
    }
  }
  const endDate = addMonthsIso(startDate, months)
  return {
    startDate,
    endDate,
    periodMonths: months,
    status: deriveStatus(endDate),
    notes,
    derived: true,
  }
}

function deriveStatus(endDate: string | null): WarrantyStatus {
  if (!endDate) return 'none'
  const end = new Date(endDate).getTime()
  const now = Date.now()
  if (end < now) return 'expired'
  const horizon = now + EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000
  if (end <= horizon) return 'expiring'
  return 'active'
}

export function formatWarrantyDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toISOString().slice(0, 10)
}

export interface WarrantyDisplayMeta {
  label: string
  badgeClass: string
  dotClass: string
}

const META: Record<WarrantyStatus, WarrantyDisplayMeta> = {
  active: {
    label: 'Active',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  expiring: {
    label: 'Expiring Soon',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  expired: {
    label: 'Expired',
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
    dotClass: 'bg-red-500',
  },
  void: {
    label: 'Void',
    badgeClass: 'bg-gray-200 text-gray-800 border-gray-300',
    dotClass: 'bg-gray-700',
  },
  none: {
    label: 'No Warranty',
    badgeClass: 'bg-gray-100 text-gray-500 border-gray-200',
    dotClass: 'bg-gray-400',
  },
  pending: {
    label: 'Pending Activation',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
    dotClass: 'bg-gray-500',
  },
  awaiting_registration: {
    label: 'Awaiting Registration',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
}

export function getWarrantyDisplayMeta(status: WarrantyStatus): WarrantyDisplayMeta {
  return META[status]
}

export interface WarrantyAssetEntry {
  asset: Asset
  view: WarrantyView
}

export interface WarrantyBuckets {
  active: number
  expiring: number
  expired: number
  void: number
  none: number
  pending: number
  awaiting_registration: number
  total: number
  byStatus: WarrantyAssetEntry[]
}

export function bucketWarranties(assets: Asset[]): WarrantyBuckets {
  const out: WarrantyBuckets = {
    active: 0,
    expiring: 0,
    expired: 0,
    void: 0,
    none: 0,
    pending: 0,
    awaiting_registration: 0,
    total: assets.length,
    byStatus: [],
  }
  for (const asset of assets) {
    const view = computeWarranty(asset)
    out[view.status]++
    out.byStatus.push({ asset, view })
  }
  return out
}

export function listExpiringSoon(
  assets: Asset[],
  limit = 5,
): WarrantyAssetEntry[] {
  return assets
    .map((asset) => ({ asset, view: computeWarranty(asset) }))
    .filter((entry) => entry.view.status === 'expiring' && entry.view.endDate)
    .sort(
      (a, b) =>
        new Date(a.view.endDate!).getTime() -
        new Date(b.view.endDate!).getTime(),
    )
    .slice(0, limit)
}

/**
 * If the asset is configured for `auto_first_scan` and has not yet been
 * activated, create an auto warranty claim and return the updated asset
 * along with a `justActivated` flag the caller can use to show a banner.
 *
 * No-op for any other activation mode or already-activated assets.
 */
export function maybeAutoActivate(asset: Asset): {
  asset: Asset
  justActivated: boolean
} {
  if (
    asset.warrantyActivationMode !== 'auto_first_scan' ||
    asset.warrantyStartDate ||
    getActiveClaim(asset.id)
  ) {
    return { asset, justActivated: false }
  }
  const periodMonths =
    asset.warrantyPeriodMonths ?? defaultWarrantyMonths(asset)
  if (!periodMonths) return { asset, justActivated: false }

  createClaim({
    thingId: asset.id,
    claimType: 'auto',
    warrantyPeriodMonths: periodMonths,
  })
  // Re-read the asset after createClaim has mirrored fields onto it
  const refreshed = mockDb.getAsset(asset.id) ?? asset
  return { asset: refreshed, justActivated: true }
}

