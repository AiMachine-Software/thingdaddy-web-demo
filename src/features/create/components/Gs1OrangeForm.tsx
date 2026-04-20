import { useState } from 'react'
import { ChevronDown, Copy, Check, Wrench } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type { Organization } from '#/lib/mockDb'
import { THING_TYPES_BY_CODE, type ThingEncoder } from '../config/thing-types'
import type { FormData } from './RegistrationForm'
import { isEnabled } from '#/lib/feature-flags'

interface Identifiers {
  elementString: string
  epcUri: string
  epcTagUri: string
  rfidHex: string
}

interface Props {
  thingTypeCode: string
  encoder: NonNullable<ThingEncoder>
  formData: FormData
  onChange: (field: keyof FormData, value: string) => void
  errors: Record<string, string>
  lockedOrg: Organization
  tagSize: string
  filterValue: string
  onTagSizeChange: (v: string) => void
  onFilterValueChange: (v: string) => void
  onFillDemo: () => void
  identifiers: Identifiers | null
}

const TAG_SIZE_OPTIONS: Record<NonNullable<ThingEncoder>, string[]> = {
  sgtin: ['96', '198'],
  cpi: ['96', 'var'],
  giai: ['96', '202'],
  gsrn: ['96'],
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        if (!text) return
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-800"
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function ReadOnlyPanel({
  label,
  sublabel,
  value,
}: {
  label: string
  sublabel?: string
  value: string
}) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-gray-700">{label}</p>
          {sublabel && (
            <p className="text-[10px] text-gray-500">{sublabel}</p>
          )}
          <p className="mt-1.5 font-mono text-sm text-emerald-700 break-all min-h-5">
            {value || <span className="text-gray-300">—</span>}
          </p>
        </div>
        <CopyButton text={value} />
      </div>
    </div>
  )
}

function DownArrow() {
  return (
    <div className="flex justify-center py-1">
      <ChevronDown className="h-5 w-5 text-emerald-500" />
    </div>
  )
}

function Field({
  label,
  ai,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string
  ai: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          {ai}
        </span>
        <label className="text-xs font-semibold text-gray-700">{label}</label>
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full rounded-lg border-0 py-2 px-3 text-sm font-mono shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-500 transition-all"
      />
      {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
    </div>
  )
}

export default function Gs1OrangeForm({
  thingTypeCode,
  encoder,
  formData,
  onChange,
  errors,
  lockedOrg,
  tagSize,
  filterValue,
  onTagSizeChange,
  onFilterValueChange,
  onFillDemo,
  identifiers,
}: Props) {
  const t = THING_TYPES_BY_CODE[thingTypeCode]
  const tagSizes = TAG_SIZE_OPTIONS[encoder]

  const sectionWrap =
    'rounded-2xl border border-gray-200 bg-white shadow-sm p-5'

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
            GS1 Encoder · {t?.label}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Live preview powered by the local GS1 library
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onFillDemo}
          className="gap-1.5"
        >
          <Wrench className="w-3.5 h-3.5" />
          Fill Demo Data
        </Button>
      </div>

      {/* Section 1: Element String inputs */}
      <div className={sectionWrap}>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          1. GS1 Element String Input
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">
              Encoding
            </label>
            <input
              readOnly
              value={`${t?.label} (${t?.aiCode})`}
              className="block w-full rounded-lg border-0 py-2 px-3 text-sm bg-gray-50 ring-1 ring-inset ring-gray-200 text-gray-700"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">
              GS1 Company Prefix Length
            </label>
            <input
              readOnly
              value={`${formData.gs1CompanyPrefix.length || lockedOrg.companyPrefix.length} digits — ${formData.gs1CompanyPrefix || lockedOrg.companyPrefix}`}
              className="block w-full rounded-lg border-0 py-2 px-3 text-sm bg-gray-50 ring-1 ring-inset ring-gray-200 text-gray-700 font-mono"
            />
          </div>
        </div>

        {/* Common: Namespace */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-700 mb-1 block">
            Namespace
          </label>
          <input
            value={formData.namespace}
            onChange={(e) => onChange('namespace', e.target.value)}
            placeholder="e.g. milesight-gw1000"
            className="block w-full rounded-lg border-0 py-2 px-3 text-sm shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-500"
          />
          {errors.namespace && (
            <p className="text-[11px] text-red-600 mt-1">{errors.namespace}</p>
          )}
        </div>

        {/* Type-specific AI inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {encoder === 'sgtin' && (
            <>
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    (01)
                  </span>
                  <label className="text-xs font-semibold text-gray-700">
                    Indicator Digit
                  </label>
                </div>
                <Select
                  value={formData.indicatorDigit}
                  onValueChange={(v) => onChange('indicatorDigit', v)}
                >
                  <SelectTrigger className="h-9 text-sm font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field
                label="Item Reference"
                ai="(01)"
                value={formData.itemReference}
                onChange={(v) => onChange('itemReference', v)}
                placeholder="e.g. 011221"
                error={errors.itemReference}
              />
              <Field
                label="Serial Number"
                ai="(21)"
                value={formData.serialNumber}
                onChange={(v) => onChange('serialNumber', v)}
                placeholder="e.g. 00001"
                error={errors.serialNumber}
              />
            </>
          )}
          {encoder === 'cpi' && (
            <>
              <Field
                label="Component / Part Reference"
                ai="(8010)"
                value={formData.componentPartReference}
                onChange={(v) => onChange('componentPartReference', v)}
                placeholder="e.g. PCB-MAIN-V2"
                error={errors.componentPartReference}
              />
              <Field
                label="Serial Number"
                ai="(8011)"
                value={formData.cpiSerialNumber}
                onChange={(v) => onChange('cpiSerialNumber', v)}
                placeholder="e.g. 00100"
                error={errors.cpiSerialNumber}
              />
            </>
          )}
          {encoder === 'giai' && (
            <Field
              label="Individual Asset Reference"
              ai="(8004)"
              value={formData.individualAssetReference}
              onChange={(v) => onChange('individualAssetReference', v)}
              placeholder="e.g. ASSET-GW1000-001"
              error={errors.individualAssetReference}
            />
          )}
          {encoder === 'gsrn' && (
            <Field
              label="Service Reference"
              ai="(8018)"
              value={formData.serviceReference}
              onChange={(v) => onChange('serviceReference', v)}
              placeholder="e.g. 0000001234"
              error={errors.serviceReference}
            />
          )}
        </div>

        {/* Live element string preview */}
        {identifiers?.elementString && (
          <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Element String
            </p>
            <p className="font-mono text-sm text-emerald-700 break-all">
              {identifiers.elementString}
            </p>
          </div>
        )}
      </div>

      <DownArrow />

      {/* Section 2: EPC Pure Identity URI */}
      <div className={sectionWrap}>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          2. EPC Pure Identity URI
        </p>
        <ReadOnlyPanel
          label="urn:epc:id:..."
          sublabel="As used in EPCIS"
          value={identifiers?.epcUri ?? ''}
        />
      </div>

      <DownArrow />

      {/* Section 3: RFID Control Information */}
      <div className={sectionWrap}>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          3. RFID Control Information
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">
              Tag Size
            </label>
            <Select value={tagSize} onValueChange={onTagSizeChange}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tagSizes.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === 'var' ? 'variable' : `${s}-bit`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">
              Filter Value
            </label>
            <Select value={filterValue} onValueChange={onFilterValueChange}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 8 }).map((_, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {i} {i === 0 ? '— all others' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DownArrow />

      {/* Section 4: EPC Tag URI */}
      <div className={sectionWrap}>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          4. EPC Tag URI
        </p>
        <ReadOnlyPanel
          label="urn:epc:tag:..."
          sublabel="As used in RFID middleware"
          value={identifiers?.epcTagUri ?? ''}
        />
      </div>

      <DownArrow />

      {/* Section 5: Memory Bank hex */}
      <div className={sectionWrap}>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          5. RFID Tag EPC Memory Bank Contents (hexadecimal)
        </p>
        <ReadOnlyPanel
          label="EPC memory bank"
          sublabel="Starting at bit 20h"
          value={identifiers?.rfidHex ?? ''}
        />
      </div>

      {/* Section 6: Warranty (optional) */}
      {isEnabled('WARRANTY_MANAGEMENT') && (
      <div className={sectionWrap}>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          6. Warranty (optional)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">
              Warranty Period
            </label>
            <Select
              value={formData.warrantyPeriodMonths || 'none'}
              onValueChange={(v) =>
                onChange('warrantyPeriodMonths', v === 'none' ? '' : v)
              }
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="6">6 months</SelectItem>
                <SelectItem value="12">12 months</SelectItem>
                <SelectItem value="24">24 months</SelectItem>
                <SelectItem value="36">36 months</SelectItem>
                <SelectItem value="custom">Custom date…</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.warrantyPeriodMonths === 'custom' && (
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">
                Warranty End Date
              </label>
              <input
                type="date"
                value={formData.warrantyEndDate}
                onChange={(e) => onChange('warrantyEndDate', e.target.value)}
                className="block w-full rounded-lg border-0 py-2 px-3 text-sm shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>
        <div className="mt-3">
          <label className="text-xs font-semibold text-gray-700 mb-1 block">
            Warranty Notes
          </label>
          <textarea
            rows={2}
            value={formData.warrantyNotes}
            onChange={(e) => onChange('warrantyNotes', e.target.value)}
            placeholder="e.g. Standard manufacturer warranty, parts only"
            className="block w-full rounded-lg border-0 py-2 px-3 text-sm shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
        <div className="mt-4">
          <label className="text-xs font-semibold text-gray-700 mb-2 block">
            Warranty Activation Mode
          </label>
          <div className="space-y-1.5">
            {[
              { v: 'manual', l: 'Manual — Customer activates via QR scan' },
              { v: 'auto_first_scan', l: 'Auto on First Scan — warranty starts on first QR scan / page visit' },
              { v: 'auto_immediate', l: 'Auto on Registration — warranty starts immediately at registration' },
              { v: 'owner_only', l: 'Manual by Owner — only the company owner can activate' },
            ].map((opt) => (
              <label
                key={opt.v}
                className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer"
              >
                <input
                  type="radio"
                  name="warrantyActivationMode"
                  value={opt.v}
                  checked={formData.warrantyActivationMode === opt.v}
                  onChange={(e) =>
                    onChange('warrantyActivationMode', e.target.value)
                  }
                  className="mt-0.5"
                />
                <span>{opt.l}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
