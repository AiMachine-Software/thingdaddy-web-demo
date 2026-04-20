import type { Asset } from '#/lib/mockDb'
import type { Gs1Code } from '#/lib/gs1-types'
import { GS1_TYPES, gs1CodeForAssetType } from '#/lib/gs1-types'

export type SearchMode = 'prefix' | 'thing-id' | 'free' | 'empty'

export function detectMode(q: string): SearchMode {
  const trimmed = q.trim()
  if (!trimmed) return 'empty'
  if (/^\d+$/.test(trimmed)) return 'prefix'
  if (trimmed.includes(':')) return 'thing-id'
  return 'free'
}

export interface ParsedThingId {
  typeCode?: string
  prefix?: string
  rest?: string
}

export function parseThingId(q: string): ParsedThingId {
  const trimmed = q.trim()
  // {TYPE}:{prefix}.{rest} — type is letters/digits/hyphen, prefix digits
  const m = trimmed.match(/^([A-Za-z][A-Za-z0-9-]*)\s*:\s*([^.\s]+)?(?:\.(.+))?$/)
  if (!m) return {}
  return {
    typeCode: m[1].toUpperCase(),
    prefix: m[2],
    rest: m[3],
  }
}

function assetMatchesText(asset: Asset, needle: string): boolean {
  const n = needle.toLowerCase()
  const haystacks = [
    asset.urn,
    asset.epcUri,
    asset.elementString,
    asset.namespace,
    asset.description,
    asset.gs1CompanyPrefix,
    asset.rfid,
  ]
  return haystacks.some((h) => !!h && h.toLowerCase().includes(n))
}

export interface SearchResult {
  matches: Asset[]
  mode: SearchMode
  parsed?: ParsedThingId
}

export function searchAssets(assets: Asset[], q: string): SearchResult {
  const mode = detectMode(q)
  if (mode === 'empty') return { matches: [], mode }

  if (mode === 'prefix') {
    const matches = assets.filter(
      (a) =>
        a.gs1CompanyPrefix?.startsWith(q.trim()) ||
        assetMatchesText(a, q.trim()),
    )
    return { matches, mode }
  }

  if (mode === 'thing-id') {
    const parsed = parseThingId(q)
    if (parsed.typeCode) {
      const assetTypeId = GS1_TYPES.find(
        (t) => t.code === parsed.typeCode && t.assetTypeId,
      )?.assetTypeId
      let matches = assets.filter((a) => {
        const typeMatch = assetTypeId
          ? a.type === assetTypeId
          : a.urn?.toLowerCase().includes(`:${parsed.typeCode!.toLowerCase()}:`)
        if (!typeMatch) return false
        if (parsed.prefix && !a.gs1CompanyPrefix?.startsWith(parsed.prefix))
          return false
        if (parsed.rest) {
          const r = parsed.rest.toLowerCase()
          if (!assetMatchesText(a, r)) return false
        }
        return true
      })
      // Fallback: substring contains over the whole query
      if (matches.length === 0) {
        matches = assets.filter((a) => assetMatchesText(a, q))
      }
      return { matches, mode, parsed }
    }
  }

  // free / fallback
  return { matches: assets.filter((a) => assetMatchesText(a, q)), mode }
}

export function groupByGs1Type(matches: Asset[]): Record<Gs1Code, Asset[]> {
  const groups = {} as Record<Gs1Code, Asset[]>
  for (const meta of GS1_TYPES) groups[meta.code] = []
  for (const a of matches) {
    // Prefer urn parse
    const m = a.urn?.match(/urn:epc:id:([a-z0-9-]+):/i)
    let code: Gs1Code | undefined
    if (m) {
      const upper = m[1].toUpperCase()
      // map sgtin->SGTIN, gsrnp->GSRN-P
      if (upper === 'GSRNP') code = 'GSRN-P'
      else if ((GS1_TYPES as readonly { code: Gs1Code }[]).some((t) => t.code === upper))
        code = upper as Gs1Code
    }
    if (!code && a.type) {
      const id = a.type as
        | 'consumable'
        | 'wip'
        | 'fixed'
        | 'human'
        | string
      if (id === 'consumable' || id === 'wip' || id === 'fixed' || id === 'human') {
        code = gs1CodeForAssetType(id)
      }
    }
    if (code && groups[code]) groups[code].push(a)
  }
  return groups
}
