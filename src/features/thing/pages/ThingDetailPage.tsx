import { useEffect, useMemo, useState } from 'react'
import { Box, Calendar, PartyPopper, ShieldCheck } from 'lucide-react'
import { mockDb, type Asset } from '#/lib/mockDb'
import {
  computeWarranty,
  formatWarrantyDate,
  maybeAutoActivate,
} from '#/lib/warranty'
import { getActiveClaim, type WarrantyClaim } from '#/lib/warrantyClaims'
import { resolveThing } from '#/lib/things'
import {
  GS1_COLOR_CLASSES,
  GS1_TYPE_BY_CODE,
  type Gs1Code,
} from '#/lib/gs1-types'
import { subdomainFromName } from '#/features/create/lib/demoData'
import WarrantyCard from '#/components/public/WarrantyCard'
import WarrantyAwaitingCard from '#/components/public/WarrantyAwaitingCard'
import IdentifierChainCard from '#/components/public/IdentifierChainCard'
import OwnershipTimeline from '#/components/public/OwnershipTimeline'
import VerifyWidget from '#/components/public/VerifyWidget'
import ThingNotFound from '#/components/public/ThingNotFound'
import { isEnabled } from '#/lib/feature-flags'

interface Props {
  thingId: string
}

const STATUS_PILL: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  suspended: 'bg-amber-100 text-amber-700 border-amber-200',
  retired: 'bg-gray-200 text-gray-700 border-gray-300',
}

function gs1CodeFromAsset(asset: Asset): Gs1Code | undefined {
  const m = asset.urn?.match(/urn:epc:id:([a-z0-9-]+):/i)
  if (m) {
    const upper = m[1].toUpperCase()
    if (upper === 'GSRNP') return 'GSRN-P'
    if (upper in GS1_TYPE_BY_CODE) return upper as Gs1Code
  }
  // Fallback by asset.type
  const map: Record<string, Gs1Code> = {
    consumable: 'SGTIN',
    wip: 'CPI',
    fixed: 'GIAI',
    human: 'GSRN',
  }
  return map[asset.type]
}

export default function ThingDetailPage({ thingId }: Props) {
  const [asset, setAsset] = useState<Asset | null | undefined>(undefined)
  const [warrantyUrl, setWarrantyUrl] = useState('')
  const [justActivated, setJustActivated] = useState(false)
  const [claim, setClaim] = useState<WarrantyClaim | undefined>()

  useEffect(() => {
    const found = resolveThing(thingId)
    if (found) {
      const result = maybeAutoActivate(found)
      setAsset(result.asset)
      setJustActivated(result.justActivated)
      setClaim(getActiveClaim(result.asset.id))
      if (typeof window !== 'undefined') {
        setWarrantyUrl(`${window.location.origin}/thing/${result.asset.id}`)
      }
    } else {
      setAsset(null)
    }
  }, [thingId])

  const org = useMemo(
    () => (asset ? mockDb.getOrgById(asset.orgId) : undefined),
    [asset],
  )
  const warranty = useMemo(() => (asset ? computeWarranty(asset) : null), [asset])
  const gs1Code = useMemo(() => (asset ? gs1CodeFromAsset(asset) : undefined), [asset])
  const typeMeta = gs1Code ? GS1_TYPE_BY_CODE[gs1Code] : undefined

  if (asset === undefined) {
    return (
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <p className="text-sm text-gray-500">Resolving Thing…</p>
      </main>
    )
  }
  if (asset === null) return <ThingNotFound query={thingId} />

  const subdomain =
    org?.subdomain ?? (org ? `${subdomainFromName(org.name)}.thingdaddy.com` : '')
  const colors = typeMeta ? GS1_COLOR_CLASSES[typeMeta.color] : undefined
  const status = (asset.status ?? 'active') as keyof typeof STATUS_PILL

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gray-50/50">
      {/* Branded header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Box className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {org?.name ?? 'Unknown Organization'}
              </p>
              {subdomain && (
                <p className="text-[11px] font-mono text-gray-500 truncate">
                  {subdomain}
                </p>
              )}
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified by ThingDaddy
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Verify widget */}
        <VerifyWidget
          registeredAt={asset.createdAt}
          thingTypeCode={gs1Code}
          encoding={typeMeta?.encoding}
          warrantyUrl={warrantyUrl}
        />

        {/* Hero */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {gs1Code && colors && (
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${colors.badge}`}
              >
                {gs1Code}
              </span>
            )}
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${STATUS_PILL[status]}`}
            >
              {status}
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 break-words">
            {asset.namespace}
          </h1>
          {asset.description && (
            <p className="mt-2 text-gray-600">{asset.description}</p>
          )}
          <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-gray-500">
            <Calendar className="w-4 h-4 text-gray-400" />
            Registered {formatWarrantyDate(asset.createdAt)}
          </p>
        </div>

        {/* Just-activated celebration banner */}
        {justActivated && isEnabled('CONSUMER_WARRANTY') && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <PartyPopper className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">
                Warranty automatically activated today!
              </p>
              <p className="text-xs text-emerald-800 mt-0.5">
                Your coverage starts now. See details below.
              </p>
            </div>
          </div>
        )}

        {/* Warranty */}
        {warranty && warranty.status === 'awaiting_registration' && isEnabled('CONSUMER_WARRANTY') ? (
          <WarrantyAwaitingCard
            thingId={asset.id}
            periodMonths={warranty.periodMonths}
          />
        ) : (
          warranty && (
            <WarrantyCard
              warranty={warranty}
              org={org}
              companyPrefix={asset.gs1CompanyPrefix}
              claim={isEnabled('CONSUMER_WARRANTY') ? claim : undefined}
              thingId={isEnabled('CONSUMER_WARRANTY') ? asset.id : undefined}
            />
          )
        )}

        {/* Identifier chain */}
        <IdentifierChainCard asset={asset} warrantyUrl={warrantyUrl} />

        {/* Ownership / audit history */}
        <OwnershipTimeline thingId={asset.id} />

        {/* Thing metadata */}
        {typeMeta && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-3">
              Thing Type Metadata
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Type
                </dt>
                <dd className="text-gray-900 font-semibold">{typeMeta.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  AI Code
                </dt>
                <dd className="font-mono text-gray-700">{typeMeta.aiCode}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Encoding
                </dt>
                <dd className="font-mono text-gray-700">{typeMeta.encoding}</dd>
              </div>
            </dl>
          </div>
        )}

        {/* Footer strip */}
        <div className="text-center text-xs text-gray-500 py-6">
          <p>
            This Thing is registered and verified on the ThingDaddy universal
            identifier registry.
          </p>
          {org?.domain && (
            <p className="mt-1">
              <a
                href={`https://${org.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Visit {org.domain}
              </a>
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
