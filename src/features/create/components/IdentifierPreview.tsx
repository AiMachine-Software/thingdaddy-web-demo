import { useState } from 'react'
import { Copy, Check, ArrowDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { QRCodeDisplay } from '#/components/QRCodeDisplay'
import type { AssetTypeId } from '../config/asset-types'

interface IdentifierRow {
  label: string
  sublabel?: string
  value: string
}

interface IdentifierPreviewProps {
  assetTypeId: AssetTypeId
  elementString: string
  epcUri: string
  epcTagUri: string
  rfidHex: string
  digitalLinkUri: string
  thingDaddyUrn: string
  thingDaddyCpi: string
  tagSize: string
  filterValue: string
  onTagSizeChange: (v: string) => void
  onFilterValueChange: (v: string) => void
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function IdentifierCard({ label, sublabel, value }: IdentifierRow) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-400">{label}</p>
          {sublabel && <p className="text-[10px] text-gray-500">{sublabel}</p>}
          <p className="mt-1.5 font-mono text-sm text-emerald-700 break-all">{value}</p>
        </div>
        <CopyButton text={value} />
      </div>
    </div>
  )
}

const TAG_SIZE_OPTIONS: Record<AssetTypeId, string[]> = {
  consumable: ['96', '198'],
  wip: ['96', 'var'],
  fixed: ['96', '202'],
  human: ['96'],
}

const Divider = () => (
  <div className="flex justify-center">
    <ArrowDown className="h-4 w-4 text-muted-foreground" />
  </div>
)

export function IdentifierPreview({
  assetTypeId,
  elementString,
  epcUri,
  epcTagUri,
  rfidHex,
  digitalLinkUri,
  thingDaddyUrn,
  thingDaddyCpi,
  tagSize,
  filterValue,
  onTagSizeChange,
  onFilterValueChange,
}: IdentifierPreviewProps) {
  const tagSizes = TAG_SIZE_OPTIONS[assetTypeId]

  return (
    <div className="space-y-3">
      <IdentifierCard
        label="GS1 Element String"
        sublabel="Application Identifier format"
        value={elementString}
      />

      <Divider />

      <IdentifierCard
        label="EPC Pure Identity URI"
        sublabel="As used in EPCIS"
        value={epcUri}
      />

      <Divider />

      {/* Tag size + filter controls */}
      <div className="flex items-center gap-4 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Tag Size</span>
          <Select value={tagSize} onValueChange={onTagSizeChange}>
            <SelectTrigger className="h-7 text-xs w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tagSizes.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === 'var' ? 'var' : `${s}-bit`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filter</span>
          <Select value={filterValue} onValueChange={onFilterValueChange}>
            <SelectTrigger className="h-7 text-xs w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 8 }, (_, i) => (
                <SelectItem key={i} value={String(i)}>
                  {i} {i === 0 ? '— all others' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <IdentifierCard
        label="EPC Tag URI"
        sublabel="As used in RFID middleware"
        value={epcTagUri}
      />

      <Divider />

      {rfidHex === 'ALPHANUMERIC_CPI_REQUIRES_VAR_ENCODING' ? (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm font-medium text-amber-800">
            Alphanumeric CPI requires CPI-var encoding (not 96-bit).
          </p>
          <p className="text-xs text-amber-600 mt-1">
            The 96-bit CPI encoding only supports numeric part references.
          </p>
        </div>
      ) : (
        <IdentifierCard
          label="RFID Tag EPC Memory Bank (hexadecimal)"
          sublabel="Starting at bit 20h"
          value={rfidHex}
        />
      )}

      <Divider />

      {/* GS1 Digital Link URI */}
      <IdentifierCard
        label="GS1 Digital Link URI"
        sublabel="Scannable link for web resolution"
        value={digitalLinkUri}
      />

      {/* QR Code */}
      <div className="rounded-xl border border-border bg-white p-6 flex justify-center">
        <QRCodeDisplay value={digitalLinkUri} size={180} label="GS1 Digital Link" />
      </div>

      {/* ThingDaddy identifiers */}
      <div className="border-t pt-4 mt-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Platform Identifiers
        </p>
        <IdentifierCard label="ThingDaddy URN" value={thingDaddyUrn} />
        <IdentifierCard label="ThingDaddy CPI Reference" value={thingDaddyCpi} />
      </div>
    </div>
  )
}
