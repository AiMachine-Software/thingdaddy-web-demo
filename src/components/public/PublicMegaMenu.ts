export type MegaIconKey =
  | 'search'
  | 'arrow-left-right'
  | 'grid'
  | 'zap'
  | 'dollar-sign'
  | 'tag'
  | 'globe'
  | 'pencil'
  | 'search-check'

export interface MegaSubItem {
  thai: string
  english?: string
  href?: string
  disabled?: boolean
  icon?: MegaIconKey
}

export interface MegaSubGroup {
  title?: string
  items: MegaSubItem[]
}

export interface MegaMainItem {
  thai: string
  badge?: string
  groups?: MegaSubGroup[]
  href?: string
  disabled?: boolean
  hasArrow?: boolean
}

export const COMING_SOON_LABEL = 'Coming Soon'

export const MEGA_MAIN_ITEMS: MegaMainItem[] = [
  {
    thai: 'Domains',
    hasArrow: true,
    groups: [
      {
        title: 'Search Domains',
        items: [
          { thai: 'Search Domain Name', href: '/search', icon: 'search' },
          { thai: 'Transfer Domain', icon: 'arrow-left-right', disabled: true },
          { thai: 'Domain Extensions (gTLD)', icon: 'grid', disabled: true },
        ],
      },
      {
        title: 'Domain Investing',
        items: [
          { thai: 'Domain Auctions', icon: 'zap', disabled: true },
          { thai: 'Domain Appraisal', icon: 'dollar-sign', disabled: true },
          { thai: 'Discount Domain Club', icon: 'tag', disabled: true },
        ],
      },
      {
        title: 'Domain Tools & Services',
        items: [
          { thai: 'WHOIS Lookup', icon: 'globe', disabled: true },
          { thai: 'Domain Name Generator', icon: 'pencil', disabled: true },
          { thai: 'Bulk Domain Search', icon: 'search-check', disabled: true },
        ],
      },
    ],
  },
  {
    thai: 'Websites',
    hasArrow: true,
    groups: [
      {
        items: [
          { thai: 'Create Website', disabled: true },
          { thai: 'WordPress Hosting', disabled: true },
          { thai: 'Website + Marketing', disabled: true },
        ],
      },
    ],
  },
  { thai: 'Email', disabled: true, hasArrow: true },
  { thai: 'Hosting', disabled: true, hasArrow: true },
  { thai: 'Marketing', disabled: true, hasArrow: true },
  { thai: 'Security', disabled: true, hasArrow: true },
  { thai: 'GoDaddy Airo', badge: '®', disabled: true },
  { thai: 'Pricing', disabled: true },
]

export const MEGA_BOTTOM_ITEMS: MegaMainItem[] = [
  { thai: 'Offers', disabled: true },
  { thai: 'Help Center', disabled: true },
]
