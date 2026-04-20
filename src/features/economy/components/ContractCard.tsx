import { Pause, XCircle, RotateCcw, Play } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { mockDb } from '#/lib/mockDb'
import type { Contract } from '#/lib/contracts'

interface Props {
  contract: Contract
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  onTerminate?: (id: string) => void
  onRenegotiate?: (id: string) => void
}

const STATUS_BADGE: Record<Contract['status'], string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  terminated: 'bg-rose-50 text-rose-700 border-rose-200',
  completed: 'bg-gray-50 text-gray-600 border-gray-200',
}

export default function ContractCard({ contract, onPause, onResume, onTerminate, onRenegotiate }: Props) {
  const buyer = mockDb.getAsset(contract.buyerThingId)
  const seller = mockDb.getAsset(contract.sellerThingId)
  const dotClass =
    contract.status === 'active'
      ? 'bg-emerald-500'
      : contract.status === 'paused'
        ? 'bg-amber-500'
        : contract.status === 'terminated'
          ? 'bg-rose-500'
          : 'bg-gray-400'

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="text-2xl leading-none">{contract.capabilityIcon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-gray-900 truncate">{contract.capabilityName}</h4>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold inline-flex items-center gap-1 ${STATUS_BADGE[contract.status]}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
              {contract.status}
            </span>
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5 truncate">
            {seller?.description ?? contract.sellerThingId} → {buyer?.description ?? contract.buyerThingId}
          </div>
          <div className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">#{contract.id}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <Stat label="Price" value={`${contract.agreedPrice} TC`} sub={`/ ${contract.unit}`} />
        <Stat label="Duration" value={contract.durationLabel} />
        <Stat label="Delivered" value={`${contract.deliveredUnits}`} sub={contract.unit} />
        <Stat label="Cost" value={`${contract.costAccrued} TC`} sub={`${contract.uptimePct}% uptime`} />
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        {contract.status === 'active' && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={() => onPause?.(contract.id)}
          >
            <Pause className="w-3.5 h-3.5" />
            Pause
          </Button>
        )}
        {contract.status === 'paused' && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={() => onResume?.(contract.id)}
          >
            <Play className="w-3.5 h-3.5" />
            Resume
          </Button>
        )}
        {contract.status !== 'terminated' && contract.status !== 'completed' && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs gap-1.5 text-rose-600 hover:bg-rose-50"
            onClick={() => onTerminate?.(contract.id)}
          >
            <XCircle className="w-3.5 h-3.5" />
            Terminate
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-xs gap-1.5 ml-auto"
          onClick={() => onRenegotiate?.(contract.id)}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Renegotiate
        </Button>
      </div>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-50/60 border border-gray-100 rounded-lg p-2">
      <div className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">{label}</div>
      <div className="text-xs font-bold text-gray-900 mt-0.5 truncate">{value}</div>
      {sub && <div className="text-[10px] text-gray-400 truncate">{sub}</div>}
    </div>
  )
}
