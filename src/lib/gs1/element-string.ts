import { buildGtin14 } from './gtin'
import { calculateCheckDigit } from './check-digit'

/** SGTIN: (01) GTIN-14 (21) serial */
export function buildSgtinElementString(
  companyPrefix: string,
  indicator: string,
  itemReference: string,
  serial: string,
): string {
  const gtin14 = buildGtin14(indicator, companyPrefix, itemReference)
  return `(01) ${gtin14} (21) ${serial}`
}

/** CPI: (8010) companyPrefix + partRef (8011) serial */
export function buildCpiElementString(
  companyPrefix: string,
  partReference: string,
  serial: string,
): string {
  return `(8010) ${companyPrefix}${partReference} (8011) ${serial}`
}

/** GIAI: (8004) companyPrefix + assetRef */
export function buildGiaiElementString(
  companyPrefix: string,
  assetReference: string,
): string {
  return `(8004) ${companyPrefix}${assetReference}`
}

/** GSRN: (8018) companyPrefix + serviceRef + checkDigit = 18 digits total */
export function buildGsrnElementString(
  companyPrefix: string,
  serviceReference: string,
): string {
  const targetServiceLen = 17 - companyPrefix.length
  const paddedRef = serviceReference.padStart(targetServiceLen, '0')
  const withoutCheck = `${companyPrefix}${paddedRef}`
  const checkDigit = calculateCheckDigit(withoutCheck)
  return `(8018) ${withoutCheck}${checkDigit}`
}
