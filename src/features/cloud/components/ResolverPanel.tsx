import { useEffect, useState } from 'react'
import { Search, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  resolveByAnyId,
  PLATFORM_LABELS,
  type ResolveResult,
  type CloudPlatform,
} from '#/lib/cloudConnections'
import { mockDb } from '#/lib/mockDb'
import { computeWarranty, formatWarrantyDate } from '#/lib/warranty'
import CloudBadge from './CloudBadge'

const PLATFORM_ROW_ORDER: CloudPlatform[] = [
  'azure',
  'aws',
  'gcp',
  'fiware',
  'custom',
]

const PLACEHOLDERS = [
  'urn:epc:id:sgtin:6922927.011221.AM319-2025-00001',
  'dev-milesight-am319-am319-2025-00001',
  'milesight/sensor/ug67-200101',
  'urn:ngsi-ld:Device:sx1302-50001',
]

interface Props {
  initialQuery?: string
}

export default function ResolverPanel({ initialQuery = '' }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [result, setResult] = useState<ResolveResult | null | undefined>(undefined)
  const [placeholderIdx, setPlaceholderIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length)
    }, 3500)
    return () => clearInterval(id)
  }, [])

  const handleResolve = (q: string = query) => {
    if (!q.trim()) return
    setResult(resolveByAnyId(q))
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleResolve()
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              ThingDaddy Universal Resolver
            </h3>
            <p className="text-xs text-gray-500">
              Resolve any identifier — EPC URI, Azure Device ID, AWS Thing Name,
              FIWARE entity — to find a Thing across all connected platforms.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={PLACEHOLDERS[placeholderIdx]}
            className="font-mono text-sm h-11"
          />
          <Button
            type="submit"
            className="h-11 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
          >
            Resolve
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Try:
          </span>
          {PLACEHOLDERS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setQuery(p)
                handleResolve(p)
              }}
              className="text-[10px] font-mono text-indigo-600 hover:text-indigo-800 hover:underline truncate max-w-[260px]"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {result === null && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              No matching Thing found
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
              We couldn't resolve "{query}" to any known Thing or cloud connection.
            </p>
          </div>
        </div>
      )}

      {result && (
        <ResultCard result={result} />
      )}
    </div>
  )
}

function ResultCard({ result }: { result: ResolveResult }) {
  const { asset, connections } = result
  const org = mockDb.getOrgById(asset.orgId)
  const warranty = computeWarranty(asset)
  const status = asset.status ?? 'active'

  const findCloudId = (platform: CloudPlatform) =>
    connections.find((c) => c.platform === platform)?.externalDeviceId ?? '—'

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white shadow-sm p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            ✓ Found
          </p>
          <h4 className="text-lg font-bold text-gray-900 truncate">
            {asset.namespace}
          </h4>
          {asset.description && (
            <p className="text-xs text-gray-500 truncate">{asset.description}</p>
          )}
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
            status === 'active'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : status === 'suspended'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-gray-100 text-gray-600 border-gray-200'
          }`}
        >
          ● {status}
        </span>
      </div>

      <dl className="space-y-2 text-xs">
        <IdRow label="ThingDaddy" value={asset.epcUri ?? asset.urn} mono />
        {PLATFORM_ROW_ORDER.map((p) => (
          <IdRow key={p} label={PLATFORM_LABELS[p]} value={findCloudId(p)} mono />
        ))}
        <div className="pt-2 mt-2 border-t border-gray-100" />
        <IdRow label="Owner" value={org?.name ?? '—'} />
        <IdRow
          label="Warranty"
          value={
            warranty.endDate
              ? `${warranty.status} (expires ${formatWarrantyDate(warranty.endDate)})`
              : warranty.status
          }
        />
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link to="/list/$assetId" params={{ assetId: asset.id }}>
            View Thing
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <a href={`/thing/${asset.id}`} target="_blank" rel="noopener noreferrer">
            View Public Page
          </a>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/cloud/messenger">Send Message</Link>
        </Button>
      </div>

      {connections.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Clouds:
          </span>
          {connections.map((c) => (
            <CloudBadge key={c.id} platform={c.platform} size="sm" withIcon />
          ))}
        </div>
      )}
    </div>
  )
}

function IdRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="text-gray-500 w-24 shrink-0">{label}:</dt>
      <dd
        className={`text-gray-800 truncate ${mono ? 'font-mono' : ''}`}
        title={value}
      >
        {value}
      </dd>
    </div>
  )
}
