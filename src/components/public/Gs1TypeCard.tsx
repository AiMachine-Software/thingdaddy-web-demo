import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { Asset } from '#/lib/mockDb'
import { GS1_COLOR_CLASSES, type Gs1TypeMeta } from '#/lib/gs1-types'

interface Props {
  type: Gs1TypeMeta
  matches: Asset[]
  isAuthenticated: boolean
}

export default function Gs1TypeCard({ type, matches, isAuthenticated }: Props) {
  const colors = GS1_COLOR_CLASSES[type.color]
  const visibleMatches = matches.slice(0, 5)
  const moreCount = matches.length - visibleMatches.length

  const ctaLabel = isAuthenticated
    ? `Register ${type.code} Now`
    : `Register ${type.code}`

  const ctaTo = isAuthenticated ? '/create' : '/login'
  const ctaSearch = isAuthenticated
    ? { thingType: type.code }
    : { redirect: '/create', thingType: type.code }

  return (
    <div
      className={`bg-white border border-gray-200 rounded-2xl p-6 shadow-sm transition-all flex flex-col h-full ${colors.ring} hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${colors.badge}`}
        >
          {type.code}
        </span>
        <span className="text-[11px] font-mono text-gray-400 text-right">
          {type.aiCode}
        </span>
      </div>

      <h3 className="text-base font-bold text-gray-900 leading-snug">
        {type.name}
      </h3>

      <dl className="mt-3 space-y-1 text-xs">
        <div className="flex gap-2">
          <dt className="text-gray-500 font-medium shrink-0">Category:</dt>
          <dd className="text-gray-700">{type.category}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-gray-500 font-medium shrink-0">Encoding:</dt>
          <dd className="text-gray-700">{type.encoding}</dd>
        </div>
      </dl>

      <div className="mt-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
        <p className="text-[10px] font-mono text-gray-600 break-all leading-relaxed">
          {type.epcFormat}
        </p>
      </div>

      {matches.length > 0 ? (
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/40 p-3">
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-2">
            Results · {matches.length}
          </p>
          <ul className="space-y-1">
            {visibleMatches.map((m) => (
              <li key={m.id}>
                <Link
                  to="/thing/$thingId"
                  params={{ thingId: m.id }}
                  className="group flex items-center justify-between gap-2 px-2 py-1 -mx-2 rounded-md hover:bg-indigo-50 text-xs text-gray-700"
                  title={m.urn}
                >
                  <span className="truncate min-w-0">
                    <span className="font-semibold text-gray-900">
                      {m.namespace}
                    </span>
                    <span className="text-gray-400 mx-1.5">—</span>
                    <span className="font-mono text-[10px] text-gray-500">
                      {m.urn}
                    </span>
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 shrink-0">
                    View →
                  </span>
                </Link>
              </li>
            ))}
            {moreCount > 0 && (
              <li className="text-[11px] font-semibold text-gray-500">
                + {moreCount} more
              </li>
            )}
          </ul>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-500">
            No Things registered yet — be the first!
          </p>
        </div>
      )}

      <div className="mt-auto pt-5">
        <Link
          to={ctaTo}
          search={ctaSearch as any}
          className={`inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors`}
        >
          {ctaLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
