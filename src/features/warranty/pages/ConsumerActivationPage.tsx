import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Shield, ShieldCheck, CheckCircle2, AlertCircle, Box } from 'lucide-react'
import { mockDb, type Asset } from '#/lib/mockDb'
import { resolveThing } from '#/lib/things'
import {
  computeWarranty,
  defaultWarrantyMonths,
  formatWarrantyDate,
} from '#/lib/warranty'
import {
  createClaim,
  getActiveClaim,
  type WarrantyClaim,
} from '#/lib/warrantyClaims'
import ThingNotFound from '#/components/public/ThingNotFound'
import { Button } from '#/components/ui/button'

interface Props {
  thingId: string
}

type Step = 'landing' | 'form' | 'done'

interface FormState {
  consumerName: string
  consumerEmail: string
  consumerPhone: string
  purchaseDate: string
  purchaseFrom: string
  receiptNumber: string
  agreed: boolean
}

const INITIAL_FORM: FormState = {
  consumerName: '',
  consumerEmail: '',
  consumerPhone: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
  purchaseFrom: '',
  receiptNumber: '',
  agreed: false,
}

function gs1CodeFromAsset(asset: Asset): string {
  const m = asset.urn?.match(/urn:epc:id:([a-z0-9-]+):/i)
  if (m) return m[1].toUpperCase()
  const map: Record<string, string> = {
    consumable: 'SGTIN',
    wip: 'CPI',
    fixed: 'GIAI',
    human: 'GSRN',
  }
  return map[asset.type] ?? asset.type.toUpperCase()
}

function serialFromAsset(asset: Asset): string {
  // last segment of URN is typically the serial / instance id
  const parts = asset.urn?.split(':') ?? []
  return parts[parts.length - 1] ?? asset.id
}

export default function ConsumerActivationPage({ thingId }: Props) {
  const [asset, setAsset] = useState<Asset | null | undefined>(undefined)
  const [existingClaim, setExistingClaim] = useState<WarrantyClaim | undefined>()
  const [step, setStep] = useState<Step>('landing')
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [createdClaim, setCreatedClaim] = useState<WarrantyClaim | null>(null)

  useEffect(() => {
    const found = resolveThing(thingId)
    setAsset(found ?? null)
    if (found) setExistingClaim(getActiveClaim(found.id))
  }, [thingId])

  const org = useMemo(
    () => (asset ? mockDb.getOrgById(asset.orgId) : undefined),
    [asset],
  )
  const warranty = useMemo(
    () => (asset ? computeWarranty(asset) : null),
    [asset],
  )
  const periodMonths = useMemo(() => {
    if (!asset) return null
    return (
      asset.warrantyPeriodMonths ??
      org?.warrantyDefaults?.periodMonths ??
      defaultWarrantyMonths(asset)
    )
  }, [asset, org])

  if (asset === undefined) {
    return (
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <p className="text-sm text-gray-500">Resolving Thing…</p>
      </main>
    )
  }
  if (asset === null) return <ThingNotFound query={thingId} />

  // ── Already retired
  if (asset.status === 'retired') {
    return (
      <CenteredCard
        icon={<AlertCircle className="w-7 h-7" />}
        iconClass="bg-red-100 text-red-600"
        title="This product is no longer active"
        body="The manufacturer has retired this Thing. Warranty activation is unavailable."
      >
        <Button asChild variant="outline">
          <Link to="/thing/$thingId" params={{ thingId: asset.id }}>
            View product
          </Link>
        </Button>
      </CenteredCard>
    )
  }

  // ── Already activated
  if (existingClaim) {
    return (
      <CenteredCard
        icon={<ShieldCheck className="w-7 h-7" />}
        iconClass="bg-emerald-100 text-emerald-600"
        title="Warranty already active"
        body={`Activated on ${formatWarrantyDate(existingClaim.activatedAt)}${
          existingClaim.consumerName ? ` by ${existingClaim.consumerName}` : ''
        }. Coverage runs until ${formatWarrantyDate(existingClaim.warrantyEndDate)}.`}
      >
        <Button asChild>
          <Link
            to="/thing/$thingId/certificate"
            params={{ thingId: asset.id }}
          >
            View certificate
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/thing/$thingId" params={{ thingId: asset.id }}>
            View product
          </Link>
        </Button>
      </CenteredCard>
    )
  }

  // ── Done state
  if (step === 'done' && createdClaim) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-gray-50/50 px-4 py-10">
        <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Warranty Activated!
              </h1>
              <p className="text-sm text-gray-600">
                Your coverage starts today.
              </p>
            </div>
          </div>
          <dl className="space-y-2 text-sm border-t border-gray-100 pt-4">
            <Row label="Product">{asset.description ?? asset.namespace}</Row>
            <Row label="Warranty">{createdClaim.warrantyPeriodMonths} months</Row>
            <Row label="Start Date">
              {formatWarrantyDate(createdClaim.warrantyStartDate)}
            </Row>
            <Row label="End Date">
              {formatWarrantyDate(createdClaim.warrantyEndDate)}
            </Row>
            <Row label="Activated by">{createdClaim.consumerName ?? '—'}</Row>
            <Row label="Certificate #">
              <span className="font-mono">{createdClaim.certificateNumber}</span>
            </Row>
          </dl>
          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <Button asChild className="flex-1">
              <Link
                to="/thing/$thingId/certificate"
                params={{ thingId: asset.id }}
              >
                Download Certificate
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/thing/$thingId" params={{ thingId: asset.id }}>
                View Product
              </Link>
            </Button>
          </div>
        </div>
      </main>
    )
  }

  // ── Form state
  if (step === 'form') {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-gray-50/50 px-4 py-10">
        <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Your Information
              </h1>
              <p className="text-xs text-gray-500">
                Activating warranty for{' '}
                <span className="font-semibold text-gray-700">
                  {asset.description ?? asset.namespace}
                </span>
              </p>
            </div>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              const next: typeof errors = {}
              if (!form.consumerName.trim()) next.consumerName = 'Required'
              if (!form.consumerEmail.trim()) next.consumerEmail = 'Required'
              else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.consumerEmail))
                next.consumerEmail = 'Invalid email'
              if (!form.purchaseDate) next.purchaseDate = 'Required'
              if (!form.purchaseFrom.trim()) next.purchaseFrom = 'Required'
              if (!form.agreed) next.agreed = 'You must agree to the terms'
              setErrors(next)
              if (Object.keys(next).length) return
              if (!periodMonths) {
                setErrors({ agreed: 'No warranty period configured for this product' })
                return
              }
              const claim = createClaim({
                thingId: asset.id,
                claimType: 'manual',
                warrantyPeriodMonths: periodMonths,
                warrantyStartDate: new Date(form.purchaseDate).toISOString(),
                consumerName: form.consumerName.trim(),
                consumerEmail: form.consumerEmail.trim(),
                consumerPhone: form.consumerPhone.trim() || undefined,
                purchaseDate: form.purchaseDate,
                purchaseFrom: form.purchaseFrom.trim(),
                receiptNumber: form.receiptNumber.trim() || undefined,
              })
              setCreatedClaim(claim)
              setStep('done')
            }}
          >
            <Field
              label="Full Name"
              error={errors.consumerName}
              value={form.consumerName}
              onChange={(v) => setForm({ ...form, consumerName: v })}
            />
            <Field
              label="Email"
              type="email"
              error={errors.consumerEmail}
              value={form.consumerEmail}
              onChange={(v) => setForm({ ...form, consumerEmail: v })}
            />
            <Field
              label="Phone (optional)"
              value={form.consumerPhone}
              onChange={(v) => setForm({ ...form, consumerPhone: v })}
            />
            <Field
              label="Purchase Date"
              type="date"
              error={errors.purchaseDate}
              value={form.purchaseDate}
              onChange={(v) => setForm({ ...form, purchaseDate: v })}
            />
            <Field
              label="Purchase From"
              placeholder='Store name or "Online"'
              error={errors.purchaseFrom}
              value={form.purchaseFrom}
              onChange={(v) => setForm({ ...form, purchaseFrom: v })}
            />
            <Field
              label="Receipt / Invoice # (optional)"
              value={form.receiptNumber}
              onChange={(v) => setForm({ ...form, receiptNumber: v })}
            />
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.agreed}
                onChange={(e) => setForm({ ...form, agreed: e.target.checked })}
                className="mt-0.5"
              />
              <span>
                I agree to the warranty terms{' '}
                {periodMonths && (
                  <span className="text-gray-500">
                    ({periodMonths}-month coverage)
                  </span>
                )}
              </span>
            </label>
            {errors.agreed && (
              <p className="text-xs text-red-600">{errors.agreed}</p>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('landing')}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1">
                Submit & Activate →
              </Button>
            </div>
          </form>
        </div>
      </main>
    )
  }

  // ── Landing
  const code = gs1CodeFromAsset(asset)
  const serial = serialFromAsset(asset)
  return (
    <main className="min-h-[calc(100vh-64px)] bg-gray-50/50 px-4 py-10">
      <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Activate Your Warranty
            </h1>
            <p className="text-sm text-gray-600">
              Verified by ThingDaddy registry
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm">
          <Row label="Product">
            <span className="inline-flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-gray-400" />
              {asset.description ?? asset.namespace}
            </span>
          </Row>
          {org && <Row label="Brand">{org.name}</Row>}
          <Row label="Type">{code}</Row>
          <Row label="Serial">
            <span className="font-mono text-xs">{serial}</span>
          </Row>
          {warranty?.periodMonths && (
            <Row label="Coverage">{warranty.periodMonths} months</Row>
          )}
        </div>

        <p className="mt-5 text-sm text-gray-700">
          This product is registered on ThingDaddy. Activate your warranty to
          get:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Official
            warranty coverage
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Proof of
            purchase record
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Product
            support access
          </li>
        </ul>

        <Button
          className="mt-6 w-full"
          onClick={() => setStep('form')}
        >
          Activate Warranty →
        </Button>
      </div>
    </main>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500 shrink-0">
        {label}
      </dt>
      <dd className="text-right text-gray-900">{children}</dd>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 bg-white'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function CenteredCard({
  icon,
  iconClass,
  title,
  body,
  children,
}: {
  icon: React.ReactNode
  iconClass: string
  title: string
  body: string
  children?: React.ReactNode
}) {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-gray-50/50 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center bg-white border border-gray-200 rounded-2xl shadow-sm p-10">
        <div
          className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${iconClass}`}
        >
          {icon}
        </div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm text-gray-600">{body}</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          {children}
        </div>
      </div>
    </main>
  )
}
