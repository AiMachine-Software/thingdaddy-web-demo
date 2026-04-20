import { Star, ShoppingCart, Handshake, ExternalLink, Shield } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Link } from '@tanstack/react-router'
import { mockDb } from '#/lib/mockDb'
import { computeWarranty } from '#/lib/warranty'
import { averageRating } from '#/lib/thingRating'
import { CATEGORY_COLOR, CATEGORY_LABEL, type ThingCapability } from '#/lib/capabilities'

interface Props {
  capability: ThingCapability
  onBuy?: (cap: ThingCapability) => void
  onNegotiate?: (cap: ThingCapability) => void
}

export default function MarketplaceListingCard({ capability, onBuy, onNegotiate }: Props) {
  const asset = mockDb.getAsset(capability.thingId)
  const org = asset ? mockDb.getOrgById(asset.orgId) : undefined
  const rating = averageRating(capability.thingId)
  const warranty = asset ? computeWarranty(asset) : undefined

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        <div className="text-3xl leading-none">{capability.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-gray-900 truncate">{capability.name}</h4>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${CATEGORY_COLOR[capability.category]}`}
            >
              {CATEGORY_LABEL[capability.category]}
            </span>
          </div>
          <div className="text-[11px] text-gray-500 truncate" title={asset?.description}>
            Seller: {asset?.description ?? capability.thingId}
          </div>
          {org && (
            <div className="text-[10px] text-gray-400 truncate">
              Owner: {org.name}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-amber-50/60 border border-amber-100 p-3 mb-3">
        <div className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">Price</div>
        <div className="text-lg font-bold text-amber-800">
          {capability.pricePerUnit} TC
          <span className="text-xs font-medium text-amber-700"> / {capability.unit}</span>
        </div>
      </div>

      {Object.keys(capability.specs).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Object.entries(capability.specs).slice(0, 3).map(([k, v]) => (
            <span
              key={k}
              className="text-[10px] bg-gray-50 border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full"
            >
              {k}: {v}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 text-[11px] text-gray-600 mb-3">
        <div className="flex items-center gap-1">
          <StarsDisplay value={rating.avg} />
          <span className="text-gray-500">
            {rating.count > 0 ? `${rating.avg} (${rating.count})` : 'No ratings'}
          </span>
        </div>
        {warranty && warranty.status === 'active' && (
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <Shield className="w-3 h-3" />
            Warranty active
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => onBuy?.(capability)}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Buy Now
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs gap-1.5"
          onClick={() => onNegotiate?.(capability)}
        >
          <Handshake className="w-3.5 h-3.5" />
          Negotiate
        </Button>
        {asset && (
          <Link
            to="/list/$assetId"
            params={{ assetId: asset.id }}
            className="ml-auto text-[11px] text-gray-500 hover:text-gray-900 inline-flex items-center gap-1"
          >
            Details
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  )
}

function StarsDisplay({ value }: { value: number }) {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
    </div>
  )
}
