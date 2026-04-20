import { useEffect, useState } from 'react'
import { ChevronLeft, Map } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { getCurrentOrgId } from '#/lib/tenant'
import { mockDb } from '#/lib/mockDb'
import { getAnnouncementsForOrg } from '#/lib/discoveryEngine'
import TopologyView from '../components/TopologyView'

export default function TopologyPage() {
  const [orgId, setOrgId] = useState<string | null>(null)
  const [counts, setCounts] = useState({ registered: 0, discovered: 0 })

  useEffect(() => {
    const id = getCurrentOrgId()
    if (!id) return
    setOrgId(id)
    setCounts({
      registered: mockDb.getAssets(id).length,
      discovered: getAnnouncementsForOrg(id).filter((a) => a.status === 'discovered').length,
    })
  }, [])

  if (!orgId) {
    return (
      <main className="min-h-[calc(100vh-64px)] py-8 px-4 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
      <Link
        to="/discovery"
        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-4"
      >
        <ChevronLeft size={14} /> Back to Discovery
      </Link>

      <div className="mb-6 flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Map size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Network Topology
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {counts.registered} registered + {counts.discovered} discovered
          </p>
        </div>
      </div>

      <TopologyView orgId={orgId} />
    </main>
  )
}
