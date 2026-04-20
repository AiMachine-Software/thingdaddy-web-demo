import { Package, Settings, Briefcase, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type AssetTypeId = 'consumable' | 'wip' | 'fixed' | 'human'

export interface AssetTypeConfig {
  id: AssetTypeId
  label: string
  subtitle: string
  gs1Scheme: string
  aiCodes: string
  epcPrefix: string
  icon: LucideIcon
}

export const ASSET_TYPES: AssetTypeConfig[] = [
  {
    id: 'consumable',
    label: 'Consumable',
    subtitle: 'Finished goods, FMCG, supplies',
    gs1Scheme: 'SGTIN',
    aiCodes: '(01) + (21)',
    epcPrefix: 'urn:epc:id:sgtin',
    icon: Package,
  },
  {
    id: 'wip',
    label: 'Work in Progress',
    subtitle: 'Components being manufactured',
    gs1Scheme: 'CPI',
    aiCodes: '(8010) + (8011)',
    epcPrefix: 'urn:epc:id:cpi',
    icon: Settings,
  },
  {
    id: 'fixed',
    label: 'Fixed Asset',
    subtitle: 'Equipment, tools, vehicles',
    gs1Scheme: 'GIAI',
    aiCodes: '(8004)',
    epcPrefix: 'urn:epc:id:giai',
    icon: Briefcase,
  },
  {
    id: 'human',
    label: 'Human Resource',
    subtitle: 'Staff badges, access cards',
    gs1Scheme: 'GSRN',
    aiCodes: '(8018)',
    epcPrefix: 'urn:epc:id:gsrn',
    icon: User,
  },
]
