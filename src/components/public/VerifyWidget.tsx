import { useState } from 'react'
import { CheckCircle2, QrCode, ChevronDown } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { QRCodeDisplay } from '#/components/QRCodeDisplay'
import { formatWarrantyDate } from '#/lib/warranty'

interface Props {
  registeredAt: string
  thingTypeCode?: string
  encoding?: string
  warrantyUrl: string
}

export default function VerifyWidget({
  registeredAt,
  thingTypeCode,
  encoding,
  warrantyUrl,
}: Props) {
  const [showQr, setShowQr] = useState(false)

  const scrollToChain = () => {
    const el = document.getElementById('identifier-chain')
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-emerald-900">Verified Thing</h2>
          <p className="text-sm text-emerald-800/90 mt-1">
            This Thing ID has been registered on the ThingDaddy registry since{' '}
            <strong>{formatWarrantyDate(registeredAt)}</strong>.
          </p>

          <dl className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <dt className="text-emerald-700/70 font-semibold uppercase tracking-wider">
                Registry
              </dt>
              <dd className="text-emerald-900 font-mono">thingdaddy.co.th</dd>
            </div>
            <div>
              <dt className="text-emerald-700/70 font-semibold uppercase tracking-wider">
                Standard
              </dt>
              <dd className="text-emerald-900">GS1 EPC TDS</dd>
            </div>
            <div>
              <dt className="text-emerald-700/70 font-semibold uppercase tracking-wider">
                Encoding
              </dt>
              <dd className="text-emerald-900 font-mono">
                {thingTypeCode}
                {encoding ? ` · ${encoding}` : ''}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowQr((v) => !v)}
              className="gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              {showQr ? 'Hide QR' : 'Scan QR to verify'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={scrollToChain}
              className="gap-1.5"
            >
              View full chain
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </div>

          {showQr && (
            <div className="mt-4 inline-block bg-white rounded-xl border border-emerald-100 p-4">
              <QRCodeDisplay
                value={warrantyUrl}
                size={150}
                label="Verify on ThingDaddy"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
