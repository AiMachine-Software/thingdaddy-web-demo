import { useState } from 'react'
import { Copy, Check, Link2 } from 'lucide-react'
import type { Asset } from '#/lib/mockDb'
import { QRCodeDisplay } from '#/components/QRCodeDisplay'

interface Props {
  asset: Asset
  warrantyUrl: string
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
  value?: string | null
}) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-gray-700">{label}</p>
          {sublabel && <p className="text-[10px] text-gray-500">{sublabel}</p>}
          <p className="mt-1.5 font-mono text-sm text-emerald-700 break-all min-h-5">
            {value || <span className="text-gray-300">—</span>}
          </p>
        </div>
        <CopyButton text={value ?? ''} />
      </div>
    </div>
  )
}

export default function IdentifierChainCard({ asset, warrantyUrl }: Props) {
  return (
    <div
      id="identifier-chain"
      className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Link2 className="w-5 h-5" />
        </div>
        <h2 className="text-base font-bold text-gray-900">Identifier Chain</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <ReadOnlyPanel
            label="GS1 Element String"
            sublabel="Application Identifier format"
            value={asset.elementString}
          />
          <ReadOnlyPanel
            label="EPC Pure Identity URI"
            sublabel="urn:epc:id:..."
            value={asset.epcUri}
          />
          <ReadOnlyPanel
            label="EPC Tag URI"
            sublabel="urn:epc:tag:..."
            value={asset.epcTagUri}
          />
          <ReadOnlyPanel
            label="RFID Tag EPC Memory Bank (hex)"
            sublabel="Starting at bit 20h"
            value={asset.rfid}
          />
          <ReadOnlyPanel
            label="GS1 Digital Link"
            sublabel="Scannable resolver URL"
            value={asset.digitalLinkUri}
          />
        </div>
        <div className="flex justify-center lg:justify-end">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <QRCodeDisplay
              value={warrantyUrl}
              size={180}
              label="Verify on ThingDaddy"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
