import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import QRCode from 'qrcode'
import { Printer } from 'lucide-react'
import { mockDb, type Asset } from '#/lib/mockDb'
import { resolveThing } from '#/lib/things'
import { computeWarranty, formatWarrantyDate } from '#/lib/warranty'
import { getActiveClaim, type WarrantyClaim } from '#/lib/warrantyClaims'
import ThingNotFound from '#/components/public/ThingNotFound'
import { Button } from '#/components/ui/button'

interface Props {
  thingId: string
}

export default function WarrantyCertificatePage({ thingId }: Props) {
  const [asset, setAsset] = useState<Asset | null | undefined>(undefined)
  const [claim, setClaim] = useState<WarrantyClaim | undefined>()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [verifyUrl, setVerifyUrl] = useState('')

  useEffect(() => {
    const found = resolveThing(thingId)
    setAsset(found ?? null)
    if (found) {
      setClaim(getActiveClaim(found.id))
      if (typeof window !== 'undefined') {
        setVerifyUrl(`${window.location.origin}/thing/${found.id}`)
      }
    }
  }, [thingId])

  useEffect(() => {
    if (!canvasRef.current || !verifyUrl) return
    QRCode.toCanvas(canvasRef.current, verifyUrl, {
      width: 160,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    }).catch(() => {})
  }, [verifyUrl])

  const org = useMemo(
    () => (asset ? mockDb.getOrgById(asset.orgId) : undefined),
    [asset],
  )
  const warranty = useMemo(
    () => (asset ? computeWarranty(asset) : null),
    [asset],
  )

  if (asset === undefined) {
    return (
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading certificate…</p>
      </main>
    )
  }
  if (asset === null) return <ThingNotFound query={thingId} />

  const startDate =
    claim?.warrantyStartDate ?? warranty?.startDate ?? asset.createdAt
  const endDate = claim?.warrantyEndDate ?? warranty?.endDate
  const periodMonths = claim?.warrantyPeriodMonths ?? warranty?.periodMonths
  const certNumber = claim?.certificateNumber ?? '—'
  const registeredTo = claim?.consumerName ?? asset.warrantyActivatedBy ?? '—'
  const activatedOn = claim?.activatedAt ?? asset.warrantyActivatedAt

  const serial = (asset.urn?.split(':') ?? []).pop() ?? asset.id

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gray-100 px-4 py-10 print:bg-white print:py-0">
      <style>{`
        @media print {
          nav, header, footer, .print\\:hidden { display: none !important; }
          body { background: white !important; }
          main { padding: 0 !important; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto print:max-w-none">
        <div className="flex items-center justify-end gap-2 mb-4 print:hidden">
          <Button asChild variant="outline">
            <Link to="/thing/$thingId" params={{ thingId: asset.id }}>
              Back to product
            </Link>
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1" /> Download as PDF
          </Button>
        </div>

        <article className="bg-white border-2 border-double border-gray-400 rounded-lg shadow-sm p-10 print:shadow-none print:border print:rounded-none">
          <header className="text-center border-b border-gray-200 pb-4 mb-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              ThingDaddy Registry
            </p>
            <h1 className="font-display text-3xl font-bold text-gray-900 mt-2">
              Warranty Certificate
            </h1>
            <p className="mt-2 font-mono text-sm text-gray-600">
              Certificate No: {certNumber}
            </p>
          </header>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <CertRow label="Product">
              {asset.description ?? asset.namespace}
            </CertRow>
            <CertRow label="Brand">{org?.name ?? '—'}</CertRow>
            <CertRow label="Serial">
              <span className="font-mono text-xs">{serial}</span>
            </CertRow>
            <CertRow label="Company Prefix">
              <span className="font-mono">{asset.gs1CompanyPrefix ?? '—'}</span>
            </CertRow>
            <CertRow label="Warranty Period">
              {periodMonths ? `${periodMonths} months` : '—'}
            </CertRow>
            <CertRow label="Status">
              {claim?.status ?? warranty?.status ?? '—'}
            </CertRow>
            <CertRow label="Start Date">{formatWarrantyDate(startDate)}</CertRow>
            <CertRow label="End Date">
              {formatWarrantyDate(endDate ?? null)}
            </CertRow>
            <CertRow label="Registered To">{registeredTo}</CertRow>
            <CertRow label="Activated On">
              {formatWarrantyDate(activatedOn ?? null)}
            </CertRow>
          </dl>

          <div className="mt-8 flex flex-col items-center gap-2 border-t border-gray-200 pt-6">
            <canvas ref={canvasRef} />
            <p className="text-xs text-gray-500 text-center">
              Scan to verify warranty status
            </p>
            <p className="text-[10px] font-mono text-gray-400 break-all max-w-xs text-center">
              {verifyUrl}
            </p>
          </div>

          <footer className="mt-8 text-center text-xs text-gray-500">
            <p>Verified on the ThingDaddy Registry</p>
            <p className="mt-1 font-semibold text-gray-700">
              thingdaddy.co.th
            </p>
          </footer>
        </article>
      </div>
    </main>
  )
}

function CertRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider font-bold text-gray-500">
        {label}
      </dt>
      <dd className="mt-1 text-gray-900">{children}</dd>
    </div>
  )
}
