import type { FormData } from '../components/RegistrationForm'
import type { GS1ApplicationData } from '#/features/register/types'

export type DemoEncoder = 'SGTIN' | 'CPI' | 'GIAI' | 'GSRN'

export interface ThingDemoPatch {
  patch: Partial<FormData>
  tagSize?: string
  filterValue?: string
}

export const THING_DEMO_DATA: Record<DemoEncoder, ThingDemoPatch> = {
  SGTIN: {
    patch: {
      gs1CompanyPrefix: '6922927',
      namespace: 'milesight-demo',
      description: 'Demo SGTIN — Milesight gateway',
      indicatorDigit: '0',
      itemReference: '011221',
      serialNumber: '00001',
      warrantyPeriodMonths: '12',
      warrantyNotes: 'Standard manufacturer warranty for sensor/consumable goods.',
    },
    tagSize: '198',
    filterValue: '0',
  },
  CPI: {
    patch: {
      gs1CompanyPrefix: '6922927',
      namespace: 'milesight-wip',
      description: 'Demo CPI — Main PCB module',
      componentPartReference: 'PCB-MAIN-V2',
      cpiSerialNumber: '00100',
      warrantyPeriodMonths: '36',
      warrantyNotes: 'Extended warranty for controller-class components.',
    },
    tagSize: '96',
    filterValue: '0',
  },
  GIAI: {
    patch: {
      gs1CompanyPrefix: '6922927',
      namespace: 'milesight-fixed',
      description: 'Demo GIAI — Gateway asset',
      individualAssetReference: 'ASSET-GW1000-001',
      warrantyPeriodMonths: '24',
      warrantyNotes: '2-year hardware warranty for fixed assets.',
    },
    tagSize: '202',
    filterValue: '0',
  },
  GSRN: {
    patch: {
      gs1CompanyPrefix: '6922927',
      namespace: 'milesight-staff',
      description: 'Demo GSRN — Staff badge',
      serviceReference: '0000001234',
      warrantyPeriodMonths: '',
      warrantyNotes: '',
    },
    tagSize: '96',
    filterValue: '0',
  },
}

export const COMPANY_DEMO_GS1_APPLICATION: GS1ApplicationData = {
  memberName: 'Xiamen Milesight IoT Co., Ltd.',
  applicationDate: new Date().toISOString().slice(0, 10),
  officeAddress: {
    no: '23',
    moo: '',
    soi: '',
    building: '2nd Software Park',
    road: 'Wanghai Road',
    subDistrict: '',
    district: 'Siming',
    province: 'Fujian (Xiamen)',
    areaCode: '361000',
    telephone: '+86-592-5085280',
    fax: '+86-592-5023280',
    email: 'info@milesight.com',
    website: 'www.milesight.com',
  },
  taxId: '91350203MA31EXAMPLE',
  taxAddressSameAsOffice: true,
  taxOfficeType: 'head',
  mailingAddressSameAsOffice: true,
  authorizer1: {
    name: 'Li Wei',
    position: 'CEO',
    phone: '+86-592-5085280',
    ext: '101',
    email: 'liwei@milesight.com',
  },
  authorizer2: {
    name: 'Zhang Min',
    position: 'CTO',
    phone: '+86-592-5085280',
    ext: '102',
    email: 'zhangmin@milesight.com',
  },
  coordinator: {
    name: 'Chen Yu',
    position: 'Operations Manager',
    phone: '+86-592-5085280',
    ext: '110',
    email: 'chenyu@milesight.com',
  },
  authorizedCapitalThb: '50,000,000',
  revenuePreviousYearThb: '25,000,000',
  incomeBracket: '5to50m',
  udiPurpose: 'no',
  businessTypes: ['manufacturer'],
  productCategory: 'IoT Devices & Sensors',
  productAmount: '~40 items',
  mainProducts: [
    { name: 'IoT Gateway', brand: 'Milesight' },
    { name: 'LoRaWAN Sensor', brand: 'Milesight' },
    { name: 'IP Camera', brand: 'Milesight' },
  ],
  ftiMembership: 'non-member',
  hearAboutUs: 'GS1 Thailand event',
}

export const COMPANY_DEMO_DATA = {
  name: 'Xiamen Milesight IoT Co., Ltd.',
  companyPrefix: '6922927',
  domain: 'milesight.com',
  country: 'CN',
  userName: 'Li Wei',
  email: 'admin@milesight.com',
  password: 'password123',
  gs1Application: COMPANY_DEMO_GS1_APPLICATION,
}

export function subdomainFromName(input: string): string {
  if (!input) return ''
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}
