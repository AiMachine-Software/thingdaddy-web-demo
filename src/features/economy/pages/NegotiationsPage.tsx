import { useMemo, useState } from 'react'
import { Handshake } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { getCurrentOrgId } from '#/lib/tenant'
import { mockDb } from '#/lib/mockDb'
import { listNegotiations, type Negotiation } from '#/lib/negotiationEngine'
import NegotiationViewer from '../components/NegotiationViewer'

export default function NegotiationsPage() {
  const orgId = getCurrentOrgId()
  const [selected, setSelected] = useState<Negotiation | null>(null)

  const all = useMemo(() => (orgId ? listNegotiations(orgId) : []), [orgId])

  if (!orgId) return <div className="p-6 text-sm text-gray-500">Please log in.</div>

  return (
    <div className="p-6 space-y-5 max-w-6xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
          <Handshake className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Negotiations</h1>
          <p className="text-sm text-gray-500">
            Autonomous price negotiations between things — open one to replay the round-by-round viewer.
          </p>
        </div>
      </div>

      {all.length === 0 ? (
        <div className="text-sm text-gray-400 py-16 text-center border border-dashed border-gray-200 rounded-2xl">
          No negotiations yet — try the marketplace or run the Machine Economy demo.
        </div>
      ) : (
        <div className="space-y-2">
          {all.map((n) => (
            <NegotiationRow key={n.id} neg={n} onOpen={() => setSelected(n)} />
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Negotiation Replay</DialogTitle>
            <DialogDescription>
              {selected?.capabilityName} — {selected?.status}
            </DialogDescription>
          </DialogHeader>
          {selected && <NegotiationViewer negotiation={selected} animate />}
          <DialogFooter>
            <Button onClick={() => setSelected(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NegotiationRow({ neg, onOpen }: { neg: Negotiation; onOpen: () => void }) {
  const buyer = mockDb.getAsset(neg.buyerThingId)
  const seller = mockDb.getAsset(neg.sellerThingId)
  const statusColor =
    neg.status === 'completed' || neg.status === 'accepted'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : neg.status === 'rejected' || neg.status === 'expired'
        ? 'bg-rose-50 text-rose-700 border-rose-200'
        : 'bg-amber-50 text-amber-700 border-amber-200'

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left rounded-xl border border-gray-200 bg-white shadow-sm p-4 hover:shadow-md hover:border-gray-300 transition-all flex items-center gap-4"
    >
      <div className="text-2xl shrink-0">{neg.capabilityIcon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900 truncate">{neg.capabilityName}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${statusColor}`}>
            {neg.status}
          </span>
        </div>
        <div className="text-[11px] text-gray-500 truncate mt-0.5">
          {seller?.description ?? neg.sellerThingId} ↔ {buyer?.description ?? neg.buyerThingId}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs text-gray-400">{neg.rounds.length} rounds</div>
        {neg.agreedPrice != null && (
          <div className="text-sm font-bold text-emerald-600">{neg.agreedPrice} TC</div>
        )}
      </div>
    </button>
  )
}
