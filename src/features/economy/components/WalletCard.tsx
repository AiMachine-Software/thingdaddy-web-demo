import { useEffect, useMemo, useState } from 'react'
import { Wallet, Plus, Send, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { mockDb } from '#/lib/mockDb'
import {
  ensureWallet,
  getWallet,
  listTransactions,
  topUp,
  type DeviceWallet,
  type WalletTransaction,
} from '#/lib/deviceWallet'

interface Props {
  thingId: string
}

export default function WalletCard({ thingId }: Props) {
  const [wallet, setWallet] = useState<DeviceWallet | undefined>(undefined)
  const [txs, setTxs] = useState<WalletTransaction[]>([])

  const reload = () => {
    const asset = mockDb.getAsset(thingId)
    if (!asset) return
    setWallet(getWallet(thingId) ?? ensureWallet(thingId, 1000))
    setTxs(listTransactions(thingId, 6))
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thingId])

  const totalsToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    let earned = 0
    let spent = 0
    for (const tx of listTransactions(thingId)) {
      if (tx.status !== 'completed') continue
      if (tx.createdAt.slice(0, 10) !== today) continue
      if (tx.toThingId === thingId) earned += tx.amount
      if (tx.fromThingId === thingId) spent += tx.amount
    }
    return { earned: round(earned), spent: round(spent) }
  }, [thingId, txs])

  if (!wallet) return null

  const handleTopUp = () => {
    topUp(thingId, 100)
    reload()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Device Wallet</h3>
          <p className="text-xs text-gray-500">
            ThingCredits (TC) — unit of value for machine-to-machine transactions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-4">
          <div className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">
            Balance
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-1">
            {format(wallet.balance)} <span className="text-sm font-semibold text-amber-700">TC</span>
          </div>
          <div className="text-[10px] text-amber-700/70 mt-0.5">
            Lifetime earned {format(wallet.totalEarned)} · spent {format(wallet.totalSpent)}
          </div>
        </div>
        <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-4">
          <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">
            Today earned
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">+{format(totalsToday.earned)} TC</div>
        </div>
        <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-4">
          <div className="text-[10px] uppercase tracking-wider text-rose-700 font-semibold">
            Today spent
          </div>
          <div className="text-xl font-bold text-rose-700 mt-1">-{format(totalsToday.spent)} TC</div>
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
          Recent transactions
        </div>
        {txs.length === 0 ? (
          <div className="text-xs text-gray-400 py-6 text-center border border-dashed border-gray-200 rounded-lg">
            No transactions yet
          </div>
        ) : (
          <ul className="space-y-1.5">
            {txs.map((tx) => (
              <TxRow key={tx.id} tx={tx} thingId={thingId} />
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100">
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" disabled>
          <Send className="w-3.5 h-3.5" />
          Send TC
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-xs gap-1.5 text-amber-700 hover:bg-amber-50"
          onClick={handleTopUp}
        >
          <Plus className="w-3.5 h-3.5" />
          Top Up +100
        </Button>
      </div>
    </div>
  )
}

function TxRow({ tx, thingId }: { tx: WalletTransaction; thingId: string }) {
  const incoming = tx.toThingId === thingId
  const other = incoming ? tx.fromThingId : tx.toThingId
  const otherAsset = mockDb.getAsset(other)
  const otherLabel = otherAsset?.description ?? other
  const age = relativeTime(tx.createdAt)
  return (
    <li className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg hover:bg-gray-50">
      {incoming ? (
        <ArrowDownCircle className="w-4 h-4 text-emerald-500 shrink-0" />
      ) : (
        <ArrowUpCircle className="w-4 h-4 text-rose-500 shrink-0" />
      )}
      <span
        className={`font-semibold shrink-0 ${incoming ? 'text-emerald-600' : 'text-rose-600'}`}
      >
        {incoming ? '+' : '-'}
        {format(tx.amount)} TC
      </span>
      <span className="text-gray-500 shrink-0">{incoming ? 'from' : 'to'}</span>
      <span className="text-gray-700 truncate flex-1" title={otherLabel}>
        {otherLabel}
      </span>
      <span className="text-gray-400 shrink-0">{age}</span>
    </li>
  )
}

function format(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60_000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  return `${days}d`
}
