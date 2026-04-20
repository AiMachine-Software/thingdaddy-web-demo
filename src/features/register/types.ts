export type IncomeBracket =
  | 'lt5m_1500'
  | 'lt5m_3000'
  | '5to50m'
  | '50to100m'
  | 'gt100m'

export type UdiPurpose = 'yes_us' | 'yes_other' | 'no'

export type FtiMembership = 'member' | 'non-member' | 'pending'

export interface GS1Address {
  no?: string
  moo?: string
  soi?: string
  building?: string
  road?: string
  subDistrict?: string
  district?: string
  province?: string
  areaCode?: string
  telephone?: string
  fax?: string
  email?: string
  website?: string
}

export interface GS1Contact {
  name?: string
  position?: string
  phone?: string
  ext?: string
  fax?: string
  email?: string
}

export interface GS1MainProduct {
  name?: string
  brand?: string
}

export interface GS1ApplicationData {
  memberName?: string
  glnNumber?: string
  applicationDate?: string

  officeAddress?: GS1Address

  taxId?: string
  taxAddressSameAsOffice?: boolean
  taxOfficeType?: 'head' | 'branch'
  taxBranchNumber?: string
  taxAddress?: GS1Address

  mailingAddressSameAsOffice?: boolean
  mailingAddress?: GS1Address

  authorizer1?: GS1Contact
  authorizer2?: GS1Contact
  coordinator?: GS1Contact

  authorizedCapitalThb?: string
  revenuePreviousYearThb?: string
  incomeBracket?: IncomeBracket

  udiPurpose?: UdiPurpose
  udiOtherCountries?: string

  businessTypes?: string[]
  productCategory?: string
  productAmount?: string
  mainProducts?: GS1MainProduct[]

  ftiMembership?: FtiMembership
  hearAboutUs?: string

  /** ISO timestamp set by the settings page on save */
  _lastUpdatedAt?: string
}

export const EMPTY_GS1_APPLICATION: GS1ApplicationData = {
  taxAddressSameAsOffice: true,
  mailingAddressSameAsOffice: true,
  taxOfficeType: 'head',
  businessTypes: [],
  mainProducts: [{}, {}, {}],
}
