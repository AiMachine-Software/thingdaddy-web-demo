/**
 * GS1 Digital Link URI builders.
 * Format: https://id.gs1.org/{AI}/{value}
 */

import { buildGtin14 } from './gtin'
import { calculateCheckDigit } from './check-digit'

/** SGTIN → https://id.gs1.org/01/{GTIN-14}/21/{serial} */
export function buildSgtinDigitalLink(
  companyPrefix: string,
  indicator: string,
  itemReference: string,
  serial: string,
): string {
  const gtin14 = buildGtin14(indicator, companyPrefix, itemReference)
  return `https://id.gs1.org/01/${gtin14}/21/${serial}`
}

/** GIAI → https://id.gs1.org/8004/{companyPrefix}{assetRef} */
export function buildGiaiDigitalLink(
  companyPrefix: string,
  assetRef: string,
): string {
  return `https://id.gs1.org/8004/${companyPrefix}${assetRef}`
}

/** CPI → https://id.gs1.org/8010/{companyPrefix}{partRef}/8011/{serial} */
export function buildCpiDigitalLink(
  companyPrefix: string,
  partRef: string,
  serial: string,
): string {
  return `https://id.gs1.org/8010/${companyPrefix}${partRef}/8011/${serial}`
}

/** GSRN → https://id.gs1.org/8018/{18-digit GSRN with check digit} */
export function buildGsrnDigitalLink(
  companyPrefix: string,
  serviceRef: string,
): string {
  const targetLen = 17 - companyPrefix.length
  const padded = serviceRef.padStart(targetLen, '0')
  const withoutCheck = `${companyPrefix}${padded}`
  const checkDigit = calculateCheckDigit(withoutCheck)
  return `https://id.gs1.org/8018/${withoutCheck}${checkDigit}`
}
