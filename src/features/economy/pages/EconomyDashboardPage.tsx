import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Film, Coins, Store, Handshake, FileSignature, ArrowRight } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { getCurrentOrgId } from '#/lib/tenant'
import { mockDb } from '#/lib/mockDb'
import { getTotalsForOrg } from '#/lib/deviceWallet'
import { listCapabilities } from '#/lib/capabilities'
import { getActiveContractsForOrg } from '#/lib/contracts'
import { listNegotiations } from '#/lib/negotiationEngine'
import EconomyStatCards from '../components/EconomyStatCards'
import DemoDayRunner from '../components/DemoDayRunner'

export default function EconomyDashboardPage() {
  const orgId = getCurrentOrgId()
  const [tick, setTick] = useState(0)
  const [demoOpen, setDemoOpen] = useState(false)

  // Force re-read after demo runs
  const refresh = () => setTick((t) => t + 1)

  const totals = useMemo(() => {
    if (!orgId) return null
    return getTotalsForOrg(orgId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, tick])

  const activeContracts = useMemo(() => {
    if (!orgId) return []
    return getActiveContractsForOrg(orgId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, tick])

  const activeNegotiations = useMemo(() => {
    if (!orgId) return []
    return listNegotiations(orgId).filter((n) => n.status === 'negotiating' || n.status === 'initiated')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, tick])

  const marketplaceCount = useMemo(() => {
    if (!orgId) return 0
    return listCapabilities({ orgId, direction: 'offer', active: true }).length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, tick])

  if (!orgId) {
    return <div className="p-6 text-sm text-gray-500">Please log in.</div>
  }
  if (!totals) return null

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Hero */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Machine Economy</h1>
          </div>
          <p className="text-sm text-gray-500">
            Every thing has a wallet, a DID, and a capability profile. Things negotiate and transact autonomously.
          </p>
        </div>
        <Button onClick={() => setDemoOpen(true)} className="gap-2">
          <Film className="w-4 h-4" />
          Run Machine Economy Demo
        </Button>
      </div>

      <EconomyStatCards
        orgTotal={totals.total}
        earnedToday={totals.earnedToday}
        spentToday={totals.spentToday}
        activeServices={activeContracts.length}
      />

      {/* Quick access */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickCard
          icon={<Store className="w-5 h-5" />}
          color="bg-sky-50 text-sky-600"
          title="Marketplace"
          subtitle={`${marketplaceCount} active listings`}
          to="/economy/marketplace"
        />
        <QuickCard
          icon={<Handshake className="w-5 h-5" />}
          color="bg-violet-50 text-violet-600"
          title="Negotiations"
          subtitle={`${activeNegotiations.length} live · ${listNegotiations(orgId).length} total`}
          to="/economy/negotiations"
        />
        <QuickCard
          icon={<FileSignature className="w-5 h-5" />}
          color="bg-emerald-50 text-emerald-600"
          title="Contracts"
          subtitle={`${activeContracts.length} active`}
          to="/economy/contracts"
        />
      </div>

      {/* Top earners / spenders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LeaderCard title="Top Earners Today" rows={totals.topEarners} kind="earned" />
        <LeaderCard title="Top Spenders Today" rows={totals.topSpenders} kind="spent" />
      </div>

      <DemoDayRunner
        open={demoOpen}
        onOpenChange={(o) => {
          setDemoOpen(o)
          if (!o) refresh()
        }}
        onFinished={refresh}
      />
    </div>
  )
}

function QuickCard({
  icon,
  color,
  title,
  subtitle,
  to,
}: {
  icon: React.ReactNode
  color: string
  title: string
  subtitle: string
  to: string
}) {
  return (
    <Link
      to={to as any}
      className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 hover:shadow-md hover:border-gray-300 transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-900">{title}</div>
          <div className="text-xs text-gray-500 truncate">{subtitle}</div>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  )
}

function LeaderCard({
  title,
  rows,
  kind,
}: {
  title: string
  rows: Array<{ thingId: string; earnedToday?: number; spentToday?: number; balance: number }>
  kind: 'earned' | 'spent'
}) {
  const filtered = rows.filter((r) => (kind === 'earned' ? (r.earnedToday ?? 0) : (r.spentToday ?? 0)) > 0)
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-3">
        {title}
      </div>
      {filtered.length === 0 ? (
        <div className="text-xs text-gray-400 py-6 text-center border border-dashed border-gray-200 rounded-lg">
          No activity yet today
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.slice(0, 5).map((row, i) => {
            const asset = mockDb.getAsset(row.thingId)
            const value = kind === 'earned' ? row.earnedToday ?? 0 : row.spentToday ?? 0
            return (
              <li
                key={row.thingId}
                className="flex items-center gap-3 text-sm py-2 px-3 rounded-lg bg-gray-50/60 border border-gray-100"
              >
                <span className="text-xs font-bold text-gray-400 w-5">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-900 truncate">
                    {asset?.description ?? row.thingId}
                  </div>
                  <div className="text-[10px] text-gray-500">Balance: {row.balance.toFixed(2)} TC</div>
                </div>
                <div
                  className={`text-sm font-bold shrink-0 ${kind === 'earned' ? 'text-emerald-600' : 'text-rose-600'}`}
                >
                  {kind === 'earned' ? '+' : '-'}
                  {value.toFixed(2)} TC
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
