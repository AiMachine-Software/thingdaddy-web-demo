import { useEffect, useMemo, useState } from 'react'
import { Key, Copy, Check, RotateCw, FileText } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { mockDb } from '#/lib/mockDb'
import {
  ensureIdentity,
  getIdentity,
  rotateKey,
  type ThingIdentity,
} from '#/lib/deviceIdentity'

interface Props {
  thingId: string
}

export default function IdentityCard({ thingId }: Props) {
  const [identity, setIdentity] = useState<ThingIdentity | undefined>(undefined)
  const [copied, setCopied] = useState<string | null>(null)
  const [docOpen, setDocOpen] = useState(false)

  const load = () => {
    const asset = mockDb.getAsset(thingId)
    if (!asset) return
    const id = getIdentity(thingId) ?? ensureIdentity(asset)
    setIdentity(id)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thingId])

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value).catch(() => {})
    setCopied(key)
    window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500)
  }

  const handleRotate = () => {
    const next = rotateKey(thingId)
    if (next) setIdentity(next)
  }

  const didDocJson = useMemo(
    () => (identity ? JSON.stringify(identity.didDocument, null, 2) : ''),
    [identity],
  )

  if (!identity) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
          <Key className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Device Identity</h3>
          <p className="text-xs text-gray-500">
            W3C Decentralized Identifier — derived from this thing's EPC URI.
          </p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Active
        </span>
      </div>

      <div className="space-y-3">
        <Field
          label="DID"
          value={identity.did}
          onCopy={() => handleCopy('did', identity.did)}
          copied={copied === 'did'}
        />
        <Field
          label="Public Key"
          value={`z${identity.publicKey}`}
          onCopy={() => handleCopy('pk', `z${identity.publicKey}`)}
          copied={copied === 'pk'}
        />
        <div className="grid grid-cols-2 gap-3 pt-1">
          <MetaRow label="Key Type" value={identity.keyType} />
          <MetaRow label="Created" value={new Date(identity.createdAt).toLocaleDateString()} />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100">
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs gap-1.5"
          onClick={() => setDocOpen(true)}
        >
          <FileText className="w-3.5 h-3.5" />
          View DID Document
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-xs gap-1.5 text-violet-600 hover:bg-violet-50"
          onClick={handleRotate}
        >
          <RotateCw className="w-3.5 h-3.5" />
          Rotate Key
        </Button>
      </div>

      <Dialog open={docOpen} onOpenChange={setDocOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>DID Document</DialogTitle>
            <DialogDescription>
              W3C DID Document for {identity.did}
            </DialogDescription>
          </DialogHeader>
          <pre className="text-[11px] font-mono bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto max-h-[60vh]">
            {didDocJson}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string
  value: string
  onCopy: () => void
  copied: boolean
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
        {label}
      </div>
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        <span className="text-xs font-mono text-gray-800 truncate flex-1" title={value}>
          {value}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-xs">
      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{label}</div>
      <div className="text-gray-800 font-medium mt-0.5">{value}</div>
    </div>
  )
}
