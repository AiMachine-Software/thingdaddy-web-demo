import { mockDb, type Asset } from './mockDb'

/**
 * Resolve a Thing by either its raw asset id (UUID) or any GS1-style identifier
 * fragment such as `SGTIN:6922927.011221.00001`. Tries exact id lookup first,
 * then falls back to a case-insensitive substring scan over the asset's URN,
 * EPC URI, EPC tag URI, element string, and digital link URI.
 */
export function resolveThing(idOrUrn: string): Asset | undefined {
  if (!idOrUrn) return undefined
  let key: string
  try {
    key = decodeURIComponent(idOrUrn).trim()
  } catch {
    key = idOrUrn.trim()
  }
  if (!key) return undefined

  const direct = mockDb.getAsset(key)
  if (direct) return direct

  const needle = key.toLowerCase()
  const all = mockDb.getAssets()
  return all.find((a) => {
    const haystacks = [
      a.urn,
      a.epcUri,
      a.epcTagUri,
      a.elementString,
      a.digitalLinkUri,
      a.rfid,
    ]
    return haystacks.some((h) => !!h && h.toLowerCase().includes(needle))
  })
}

/**
 * Resolve an asset from a GS1 Digital Link `(01)/{gtin}/(21)/{serial}` pair.
 * The 14-digit GTIN encodes indicator + company prefix + item ref + check digit;
 * we strip the indicator (1 char) and check digit (1 char), then look for the
 * resulting prefix+itemRef anywhere in the asset's URN/EPC URI alongside the
 * serial.
 */
export function resolveByGs1DigitalLink(
  gtin: string,
  serial: string,
): Asset | undefined {
  if (!gtin || !serial) return undefined
  const compact = gtin.replace(/\D/g, '')
  // Try the full gtin + serial match first
  const direct = resolveThing(`${compact}.${serial}`)
  if (direct) return direct
  // Try matching just the serial
  const all = mockDb.getAssets()
  const serialNeedle = serial.toLowerCase()
  return all.find((a) => {
    const fields = [a.urn, a.epcUri, a.epcTagUri, a.elementString, a.digitalLinkUri]
    return fields.some(
      (h) =>
        !!h &&
        h.toLowerCase().includes(serialNeedle) &&
        (h.includes(compact) || (compact.length > 2 && h.includes(compact.slice(1, -1)))),
    )
  })
}
