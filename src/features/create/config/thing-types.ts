import { GS1_TYPES, type Gs1Code } from '#/lib/gs1-types'
import type { AssetTypeId } from './asset-types'

export type ThingEncoder = 'sgtin' | 'cpi' | 'giai' | 'gsrn' | null

export interface ThingTypeConfig {
  code: string
  label: string
  aiCode: string
  description: string
  category: 'gs1' | 'other'
  encoder: ThingEncoder
  recommendedFor?: AssetTypeId[]
}

const ENCODER_FOR: Record<string, ThingEncoder> = {
  SGTIN: 'sgtin',
  CPI: 'cpi',
  GIAI: 'giai',
  GSRN: 'gsrn',
}

const RECOMMENDED: Record<string, AssetTypeId[]> = {
  SGTIN: ['consumable'],
  CPI: ['wip'],
  GIAI: ['fixed'],
  GRAI: ['fixed'],
  GSRN: ['human'],
  'GSRN-P': ['human'],
}

const LABELS: Record<string, string> = {
  SGTIN: 'GTIN + serial',
  SSCC: 'SSCC',
  SGLN: 'GLN + ext',
  GRAI: 'GRAI with serial',
  GIAI: 'GIAI',
  GSRN: 'GSRN',
  'GSRN-P': 'GSRN-P',
  GDTI: 'GDTI with serial',
  CPI: 'CPI + ser',
  GCN: 'GCN with serial',
  GINC: 'GINC',
  GSIN: 'GSIN',
  ITIP: 'ITIP',
  UPUI: 'UPUI',
  PGLN: 'PGLN',
}

const GS1_THING_TYPES: ThingTypeConfig[] = GS1_TYPES.map((t) => ({
  code: t.code,
  label: LABELS[t.code] ?? t.code,
  aiCode: t.aiCode,
  description: t.name,
  category: 'gs1' as const,
  encoder: ENCODER_FOR[t.code] ?? null,
  recommendedFor: RECOMMENDED[t.code],
}))

const OTHER_THING_TYPES: ThingTypeConfig[] = [
  {
    code: 'GID',
    label: 'GID',
    aiCode: '—',
    description: 'General Identifier',
    category: 'other',
    encoder: null,
  },
  {
    code: 'USDoD',
    label: 'USDoD',
    aiCode: '—',
    description: 'US Department of Defense',
    category: 'other',
    encoder: null,
  },
  {
    code: 'ADI',
    label: 'ADI',
    aiCode: '—',
    description: 'Aerospace & Defense Identifier',
    category: 'other',
    encoder: null,
  },
  {
    code: 'BIC',
    label: 'BIC',
    aiCode: '—',
    description: 'Bureau International des Containers',
    category: 'other',
    encoder: null,
  },
  {
    code: 'IMOVN',
    label: 'IMOVN',
    aiCode: '—',
    description: 'IMO Vessel Number',
    category: 'other',
    encoder: null,
  },
]

export const THING_TYPES: ThingTypeConfig[] = [...GS1_THING_TYPES, ...OTHER_THING_TYPES]

export const THING_TYPES_BY_CODE: Record<string, ThingTypeConfig> = Object.fromEntries(
  THING_TYPES.map((t) => [t.code, t]),
)

export function recommendedFor(assetType: AssetTypeId | null): string[] {
  if (!assetType) return []
  return THING_TYPES.filter((t) => t.recommendedFor?.includes(assetType)).map(
    (t) => t.code,
  )
}

const ENCODER_TO_ASSET: Record<NonNullable<ThingEncoder>, AssetTypeId> = {
  sgtin: 'consumable',
  cpi: 'wip',
  giai: 'fixed',
  gsrn: 'human',
}

export function assetTypeForEncoder(enc: NonNullable<ThingEncoder>): AssetTypeId {
  return ENCODER_TO_ASSET[enc]
}

export function assetTypeForThingCode(code: string): AssetTypeId | undefined {
  const t = THING_TYPES_BY_CODE[code.toUpperCase()] ?? THING_TYPES_BY_CODE[code]
  if (!t) return undefined
  if (t.encoder) return ENCODER_TO_ASSET[t.encoder]
  // Map by recommendedFor
  return t.recommendedFor?.[0]
}

export type { Gs1Code }
