/**
 * EPC Tag URI builders.
 * Adds tag size and filter value to the EPC scheme.
 * Format: urn:epc:tag:{scheme}-{tagSize}:{filter}.{fields...}
 */

export function buildSgtinTagUri(
  companyPrefix: string,
  indicator: string,
  itemReference: string,
  serial: string,
  filter: number = 0,
  tagSize: number = 198,
): string {
  return `urn:epc:tag:sgtin-${tagSize}:${filter}.${companyPrefix}.${indicator}${itemReference}.${serial}`
}

export function buildCpiTagUri(
  companyPrefix: string,
  partReference: string,
  serial: string,
  filter: number = 0,
  tagSize: number = 96,
): string {
  return `urn:epc:tag:cpi-${tagSize}:${filter}.${companyPrefix}.${partReference}.${serial}`
}

export function buildGiaiTagUri(
  companyPrefix: string,
  assetReference: string,
  filter: number = 0,
  tagSize: number = 202,
): string {
  return `urn:epc:tag:giai-${tagSize}:${filter}.${companyPrefix}.${assetReference}`
}

export function buildGsrnTagUri(
  companyPrefix: string,
  serviceReference: string,
  filter: number = 0,
): string {
  // GSRN only has 96-bit encoding
  return `urn:epc:tag:gsrn-96:${filter}.${companyPrefix}.${serviceReference}`
}
