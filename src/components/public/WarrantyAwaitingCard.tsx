import { Link } from '@tanstack/react-router'
import { Shield } from 'lucide-react'
import { Button } from '#/components/ui/button'

interface Props {
  thingId: string
  periodMonths: number | null
}

export default function WarrantyAwaitingCard({ thingId, periodMonths }: Props) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">
            Warranty Status: Awaiting Registration
          </h2>
          <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider">
            Action required
          </p>
        </div>
      </div>
      <p className="text-sm text-gray-700">
        This product's warranty has not been activated yet. If you purchased
        this product, activate your warranty now.
      </p>
      {periodMonths != null && (
        <p className="mt-2 text-sm text-gray-700">
          <span className="font-semibold">Warranty Period:</span>{' '}
          {periodMonths} months (after activation)
        </p>
      )}
      <div className="mt-5">
        <Button asChild>
          <Link to="/thing/$thingId/activate" params={{ thingId }}>
            Activate My Warranty →
          </Link>
        </Button>
      </div>
    </div>
  )
}
