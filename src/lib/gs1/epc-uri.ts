/**
 * EPC Pure Identity URI builders.
 * Format: urn:epc:id:{scheme}:{fields...}
 */

/** urn:epc:id:sgtin:CompanyPrefix.IndicatorItemRef.Serial */
export function buildSgtinUri(
  companyPrefix: string,
  indicator: string,
  itemReference: string,
  serial: string,
): string {
  return `urn:epc:id:sgtin:${companyPrefix}.${indicator}${itemReference}.${serial}`
}

/** urn:epc:id:cpi:CompanyPrefix.ComponentPartRef.Serial */
export function buildCpiUri(
  companyPrefix: string,
  partReference: string,
  serial: string,
): string {
  return `urn:epc:id:cpi:${companyPrefix}.${partReference}.${serial}`
}

/** urn:epc:id:giai:CompanyPrefix.IndividualAssetRef */
export function buildGiaiUri(
  companyPrefix: string,
  assetReference: string,
): string {
  return `urn:epc:id:giai:${companyPrefix}.${assetReference}`
}

/** urn:epc:id:gsrn:CompanyPrefix.ServiceRef */
export function buildGsrnUri(
  companyPrefix: string,
  serviceReference: string,
): string {
  return `urn:epc:id:gsrn:${companyPrefix}.${serviceReference}`
}
