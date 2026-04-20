import { AlertTriangle } from 'lucide-react'

export default function UnavailabilityBanner({ query }: { query?: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-base font-bold text-amber-900">
          Sorry, thingdaddy.co.th unavailable
        </h3>
        <p className="text-sm text-amber-800/90 mt-1">
          This identifier{query ? ` "${query}"` : ''} is already registered in the
          ThingDaddy registry.
        </p>
      </div>
    </div>
  )
}
