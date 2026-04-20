import { Link } from '@tanstack/react-router'
import { Link2, Cpu } from 'lucide-react'
import { mockDb } from '#/lib/mockDb'
import { getRelationshipsForParent } from '#/lib/discoveryEngine'

interface Props {
  thingId: string
}

export default function PairedDevicesCard({ thingId }: Props) {
  const rels = getRelationshipsForParent(thingId)
  if (rels.length === 0) return null

  const children = rels
    .map((r) => {
      const child = mockDb.getAsset(r.childThingId)
      return child ? { rel: r, child } : null
    })
    .filter((x): x is NonNullable<typeof x> => x != null)

  if (children.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Link2 size={16} className="text-teal-600" />
        <h2 className="text-base font-bold text-gray-900">Connected Devices</h2>
        <span className="text-xs text-gray-400">({children.length})</span>
      </div>
      <ul className="space-y-2">
        {children.map(({ rel, child }) => (
          <li key={rel.id}>
            <Link
              to="/list/$assetId"
              params={{ assetId: child.id }}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:border-indigo-200 hover:bg-indigo-50/30"
            >
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500">
                <Cpu size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {child.description ?? child.namespace}
                  </p>
                  <span
                    className={`text-[9px] font-bold uppercase rounded-full px-1.5 py-0.5 border ${
                      rel.autoDiscovered
                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}
                  >
                    {rel.autoDiscovered ? 'auto-paired' : 'manual'}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-gray-400 truncate">{child.epcUri}</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 shrink-0">
                <span className="uppercase">{rel.protocol}</span>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    child.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
