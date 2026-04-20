import { calculateCheckDigit } from './check-digit'

/**
 * Build a GTIN-14 from indicator digit + company prefix + item reference.
 * Total: 1 (indicator) + company prefix + item reference = 13 digits, then append check digit = 14.
 */
export function buildGtin14(
  indicator: string,
  companyPrefix: string,
  itemReference: string,
): string {
  // Pad item reference so indicator + prefix + itemRef = 13 digits
  const targetItemLen = 13 - 1 - companyPrefix.length
  const paddedItemRef = itemReference.padStart(targetItemLen, '0')
  const withoutCheck = `${indicator}${companyPrefix}${paddedItemRef}`
  const checkDigit = calculateCheckDigit(withoutCheck)
  return `${withoutCheck}${checkDigit}`
}
