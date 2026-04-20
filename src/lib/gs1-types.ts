import type { AssetTypeId } from '#/features/create/config/asset-types'

export type Gs1Code =
  | 'SGTIN'
  | 'SSCC'
  | 'SGLN'
  | 'GRAI'
  | 'GIAI'
  | 'GSRN'
  | 'GSRN-P'
  | 'GDTI'
  | 'CPI'
  | 'GCN'
  | 'GINC'
  | 'GSIN'
  | 'ITIP'
  | 'UPUI'
  | 'PGLN'

export type Gs1ColorKey = 'blue' | 'amber' | 'green' | 'purple' | 'gray'

export interface Gs1TypeMeta {
  code: Gs1Code
  aiCode: string
  name: string
  category: string
  epcFormat: string
  encoding: string
  color: Gs1ColorKey
  assetTypeId?: AssetTypeId
}

export const GS1_COLOR_CLASSES: Record<
  Gs1ColorKey,
  { badge: string; ring: string; accent: string }
> = {
  blue: {
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    ring: 'hover:border-blue-300',
    accent: 'text-blue-600',
  },
  amber: {
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    ring: 'hover:border-amber-300',
    accent: 'text-amber-600',
  },
  green: {
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    ring: 'hover:border-emerald-300',
    accent: 'text-emerald-600',
  },
  purple: {
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    ring: 'hover:border-purple-300',
    accent: 'text-purple-600',
  },
  gray: {
    badge: 'bg-gray-100 text-gray-700 border-gray-200',
    ring: 'hover:border-gray-300',
    accent: 'text-gray-600',
  },
}

export const GS1_TYPES: Gs1TypeMeta[] = [
  {
    code: 'SGTIN',
    aiCode: 'AI 01 + AI 21',
    name: 'Serialized Global Trade Item Number',
    category: 'Consumable / Finished Goods',
    epcFormat: 'urn:epc:id:sgtin:CompanyPrefix.ItemRefAndIndicator.Serial',
    encoding: '96-bit / 198-bit',
    color: 'blue',
    assetTypeId: 'consumable',
  },
  {
    code: 'SSCC',
    aiCode: 'AI 00',
    name: 'Serial Shipping Container Code',
    category: 'Logistics Unit',
    epcFormat: 'urn:epc:id:sscc:CompanyPrefix.SerialReference',
    encoding: '96-bit',
    color: 'gray',
  },
  {
    code: 'SGLN',
    aiCode: 'AI 414 + AI 254',
    name: 'Global Location Number with Extension',
    category: 'Location',
    epcFormat: 'urn:epc:id:sgln:CompanyPrefix.LocationRef.Extension',
    encoding: '96-bit / 195-bit',
    color: 'gray',
  },
  {
    code: 'GRAI',
    aiCode: 'AI 8003',
    name: 'Global Returnable Asset Identifier',
    category: 'Returnable Asset',
    epcFormat: 'urn:epc:id:grai:CompanyPrefix.AssetType.Serial',
    encoding: '96-bit / 170-bit',
    color: 'gray',
  },
  {
    code: 'GIAI',
    aiCode: 'AI 8004',
    name: 'Global Individual Asset Identifier',
    category: 'Fixed Asset',
    epcFormat: 'urn:epc:id:giai:CompanyPrefix.IndividualAssetReference',
    encoding: '96-bit / 202-bit',
    color: 'green',
    assetTypeId: 'fixed',
  },
  {
    code: 'GSRN',
    aiCode: 'AI 8018',
    name: 'Global Service Relation Number',
    category: 'Human Resource / Service',
    epcFormat: 'urn:epc:id:gsrn:CompanyPrefix.ServiceReference',
    encoding: '96-bit',
    color: 'purple',
    assetTypeId: 'human',
  },
  {
    code: 'GSRN-P',
    aiCode: 'AI 8017',
    name: 'Global Service Relation Number – Provider',
    category: 'Service Provider',
    epcFormat: 'urn:epc:id:gsrnp:CompanyPrefix.ServiceReference',
    encoding: '96-bit',
    color: 'gray',
  },
  {
    code: 'GDTI',
    aiCode: 'AI 253',
    name: 'Global Document Type Identifier',
    category: 'Document',
    epcFormat: 'urn:epc:id:gdti:CompanyPrefix.DocumentType.Serial',
    encoding: '96-bit / 174-bit',
    color: 'gray',
  },
  {
    code: 'CPI',
    aiCode: 'AI 8010 + AI 8011',
    name: 'Component / Part Identifier',
    category: 'Work in Progress / Component',
    epcFormat: 'urn:epc:id:cpi:CompanyPrefix.ComponentRef.Serial',
    encoding: '96-bit / variable',
    color: 'amber',
    assetTypeId: 'wip',
  },
  {
    code: 'GCN',
    aiCode: 'AI 255',
    name: 'Global Coupon Number with Serial',
    category: 'Coupon',
    epcFormat: 'urn:epc:id:gcn:CompanyPrefix.CouponRef.Serial',
    encoding: '96-bit',
    color: 'gray',
  },
  {
    code: 'GINC',
    aiCode: 'AI 401',
    name: 'Global Identification Number of Consignment',
    category: 'Consignment',
    epcFormat: 'urn:epc:id:ginc:CompanyPrefix.ConsignmentRef',
    encoding: 'variable',
    color: 'gray',
  },
  {
    code: 'GSIN',
    aiCode: 'AI 402',
    name: 'Global Shipment Identification Number',
    category: 'Shipment',
    epcFormat: 'urn:epc:id:gsin:CompanyPrefix.ShipperRef',
    encoding: '96-bit',
    color: 'gray',
  },
  {
    code: 'ITIP',
    aiCode: 'AI 8006 + AI 21',
    name: 'Identification of Trade Item Pieces',
    category: 'Trade Item Piece',
    epcFormat: 'urn:epc:id:itip:CompanyPrefix.ItemRef.Piece.Total.Serial',
    encoding: '110-bit / 212-bit',
    color: 'gray',
  },
  {
    code: 'UPUI',
    aiCode: 'AI 01 + AI 235',
    name: 'Unit Pack Unique Identifier',
    category: 'Regulated Unit',
    epcFormat: 'urn:epc:id:upui:CompanyPrefix.ItemRef.TPX',
    encoding: 'variable',
    color: 'gray',
  },
  {
    code: 'PGLN',
    aiCode: 'AI 417',
    name: 'Party Global Location Number',
    category: 'Party / Organization',
    epcFormat: 'urn:epc:id:pgln:CompanyPrefix.PartyRef',
    encoding: '96-bit',
    color: 'gray',
  },
]

export const GS1_TYPE_BY_CODE: Record<string, Gs1TypeMeta> = Object.fromEntries(
  GS1_TYPES.map((t) => [t.code, t]),
)

const ASSET_TYPE_TO_GS1: Record<AssetTypeId, Gs1Code> = {
  consumable: 'SGTIN',
  wip: 'CPI',
  fixed: 'GIAI',
  human: 'GSRN',
}

export function gs1CodeForAssetType(id: AssetTypeId): Gs1Code {
  return ASSET_TYPE_TO_GS1[id]
}

export function assetTypeForGs1Code(code: string): AssetTypeId | undefined {
  const upper = code.toUpperCase() as Gs1Code
  return GS1_TYPE_BY_CODE[upper]?.assetTypeId
}
