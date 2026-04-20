import { useMemo, useState } from 'react'
import { Store, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { getCurrentOrgId } from '#/lib/tenant'
import {
  CATEGORY_LABEL,
  listCapabilities,
  type CapabilityCategory,
  type ThingCapability,
} from '#/lib/capabilities'
import { mockDb } from '#/lib/mockDb'
import {
  runAutoNegotiation,
  type Negotiation,
} from '#/lib/negotiationEngine'
import { transfer } from '#/lib/deviceWallet'
import { createContract } from '#/lib/contracts'
import MarketplaceListingCard from '../components/MarketplaceListingCard'
import NegotiationViewer from '../components/NegotiationViewer'

type SortKey = 'price_asc' | 'price_desc' | 'name'

export default function MarketplacePage() {
  const orgId = getCurrentOrgId()
  const [category, setCategory] = useState<'all' | CapabilityCategory>('all')
  const [sort, setSort] = useState<SortKey>('price_asc')
  const [search, setSearch] = useState('')
  const [tick, setTick] = useState(0)
  const [viewer, setViewer] = useState<Negotiation | null>(null)
  const [buyDialog, setBuyDialog] = useState<{ cap: ThingCapability; buyerId: string } | null>(null)

  const listings = useMemo(() => {
    if (!orgId) return []
    let list = listCapabilities({ orgId, direction: 'offer', active: true })
    if (category !== 'all') list = list.filter((c) => c.category === category)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          (mockDb.getAsset(c.thingId)?.description ?? '').toLowerCase().includes(q),
      )
    }
    switch (sort) {
      case 'price_asc':
        list = [...list].sort((a, b) => a.pricePerUnit - b.pricePerUnit)
        break
      case 'price_desc':
        list = [...list].sort((a, b) => b.pricePerUnit - a.pricePerUnit)
        break
      case 'name':
        list = [...list].sort((a, b) => a.name.localeCompare(b.name))
        break
    }
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, category, sort, search, tick])

  const availableBuyers = useMemo(() => {
    if (!orgId) return []
    return mockDb.getAssets(orgId).filter((a) => a.status !== 'retired')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, tick])

  const openBuy = (cap: ThingCapability) => {
    const defaultBuyer = availableBuyers.find((b) => b.id !== cap.thingId)
    if (!defaultBuyer) return
    setBuyDialog({ cap, buyerId: defaultBuyer.id })
  }

  const handleBuyNow = () => {
    if (!buyDialog || !orgId) return
    const { cap, buyerId } = buyDialog
    const contract = createContract({
      orgId,
      buyerThingId: buyerId,
      sellerThingId: cap.thingId,
      capabilityId: cap.id,
      capabilityName: cap.name,
      capabilityIcon: cap.icon,
      agreedPrice: cap.pricePerUnit,
      unit: cap.unit,
      durationLabel: '7 days',
    })
    transfer({
      fromThingId: buyerId,
      toThingId: cap.thingId,
      amount: cap.pricePerUnit,
      type: cap.category === 'energy' ? 'energy_trade' : cap.category === 'compute' ? 'compute_job' : 'data_purchase',
      description: `Marketplace buy-now: ${cap.name}`,
      contractId: contract.id,
    })
    setBuyDialog(null)
    setTick((t) => t + 1)
  }

  const handleNegotiate = (cap: ThingCapability) => {
    if (!orgId) return
    const buyer = availableBuyers.find((b) => b.id !== cap.thingId)
    if (!buyer) return
    const budget = Math.round(cap.pricePerUnit * 0.8 * 100) / 100
    const neg = runAutoNegotiation({
      orgId,
      buyerThingId: buyer.id,
      sellerThingId: cap.thingId,
      capabilityId: cap.id,
      buyerBudget: budget,
      sellerMinAccept: Math.max(1, cap.pricePerUnit * 0.5),
      buyerStrategy: 'balanced',
      sellerStrategy: 'balanced',
      maxRounds: 5,
      contractDuration: '7 days',
      persist: true,
    })
    setViewer(neg)
    setTick((t) => t + 1)
  }

  if (!orgId) return <div className="p-6 text-sm text-gray-500">Please log in.</div>

  return (
    <div className="p-6 space-y-5 max-w-6xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thing Marketplace</h1>
          <p className="text-sm text-gray-500">
            Browse capabilities offered by things in your organization.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search capabilities or sellers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v as 'all' | CapabilityCategory)}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {(Object.keys(CATEGORY_LABEL) as CapabilityCategory[]).map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price_asc">Price: Low → High</SelectItem>
            <SelectItem value="price_desc">Price: High → Low</SelectItem>
            <SelectItem value="name">Name (A → Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Listings */}
      {listings.length === 0 ? (
        <div className="text-sm text-gray-400 py-16 text-center border border-dashed border-gray-200 rounded-2xl">
          No listings match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((cap) => (
            <MarketplaceListingCard
              key={cap.id}
              capability={cap}
              onBuy={openBuy}
              onNegotiate={handleNegotiate}
            />
          ))}
        </div>
      )}

      {/* Negotiation viewer modal */}
      <Dialog open={!!viewer} onOpenChange={(o) => !o && setViewer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Live Negotiation</DialogTitle>
            <DialogDescription>
              Watching auto-negotiation for {viewer?.capabilityName}.
            </DialogDescription>
          </DialogHeader>
          {viewer && <NegotiationViewer negotiation={viewer} animate />}
          <DialogFooter>
            <Button onClick={() => setViewer(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Buy Now dialog — pick buyer */}
      <Dialog open={!!buyDialog} onOpenChange={(o) => !o && setBuyDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Buy {buyDialog?.cap.name}</DialogTitle>
            <DialogDescription>
              Pick a thing to buy this service on behalf of. Price:{' '}
              <span className="font-bold text-amber-600">
                {buyDialog?.cap.pricePerUnit} TC / {buyDialog?.cap.unit}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <label className="text-xs font-semibold text-gray-600">Buyer thing</label>
            <Select
              value={buyDialog?.buyerId ?? ''}
              onValueChange={(v) => setBuyDialog((b) => (b ? { ...b, buyerId: v } : b))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableBuyers
                  .filter((b) => b.id !== buyDialog?.cap.thingId)
                  .map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.description ?? b.id}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBuyDialog(null)}>Cancel</Button>
            <Button onClick={handleBuyNow}>Confirm purchase</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
