import { useEffect, useState } from 'react'
import { ClipboardList, Plus, Trash2 } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { mockDb } from '#/lib/mockDb'
import {
  CAPABILITY_TEMPLATES,
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  createCapability,
  deleteCapability,
  listCapabilities,
  type CapabilityDirection,
  type ThingCapability,
} from '#/lib/capabilities'

interface Props {
  thingId: string
}

export default function CapabilityCard({ thingId }: Props) {
  const [caps, setCaps] = useState<ThingCapability[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [templateIdx, setTemplateIdx] = useState('0')

  const reload = () => setCaps(listCapabilities({ thingId }))

  useEffect(() => {
    reload()
  }, [thingId])

  const offers = caps.filter((c) => c.direction === 'offer')
  const needs = caps.filter((c) => c.direction === 'need')

  const handleAdd = () => {
    const tpl = CAPABILITY_TEMPLATES[parseInt(templateIdx, 10)]
    if (!tpl) return
    const asset = mockDb.getAsset(thingId)
    createCapability({ thingId, orgId: asset?.orgId, template: tpl })
    setModalOpen(false)
    reload()
  }

  const handleDelete = (id: string) => {
    deleteCapability(id)
    reload()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
          <ClipboardList className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Capabilities &amp; Services</h3>
          <p className="text-xs text-gray-500">
            What this thing offers to sell and what it needs to buy on the marketplace.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto h-8 text-xs gap-1.5"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Capability
        </Button>
      </div>

      <Section title="This thing OFFERS" caps={offers} emptyHint="No services offered yet" onDelete={handleDelete} />
      <div className="h-4" />
      <Section title="This thing NEEDS" caps={needs} emptyHint="No resource needs declared" onDelete={handleDelete} />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Capability</DialogTitle>
            <DialogDescription>Pick a pre-built template to add an offer or need.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold text-gray-600">Template</label>
            <Select value={templateIdx} onValueChange={setTemplateIdx}>
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {CAPABILITY_TEMPLATES.map((t, i) => (
                  <SelectItem key={`${t.name}-${t.direction}`} value={String(i)}>
                    {t.icon} {t.name} — {t.direction === 'offer' ? 'Offer' : 'Need'} — {t.pricePerUnit} TC / {t.unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Section({
  title,
  caps,
  emptyHint,
  onDelete,
}: {
  title: string
  caps: ThingCapability[]
  emptyHint: string
  onDelete: (id: string) => void
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
        {title}
      </div>
      {caps.length === 0 ? (
        <div className="text-xs text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-lg">
          {emptyHint}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {caps.map((c) => (
            <CapBlock key={c.id} cap={c} onDelete={() => onDelete(c.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function CapBlock({ cap, onDelete }: { cap: ThingCapability; onDelete: () => void }) {
  return (
    <div className="rounded-xl border border-gray-200 p-3 bg-gray-50/40 group">
      <div className="flex items-start gap-2">
        <div className="text-xl leading-none shrink-0">{cap.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-900 truncate">{cap.name}</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${CATEGORY_COLOR[cap.category]}`}
            >
              {CATEGORY_LABEL[cap.category]}
            </span>
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{cap.description}</div>
          <div className="text-[11px] text-gray-700 mt-1">
            <span className="font-semibold text-amber-600">{cap.pricePerUnit} TC</span>
            <span className="text-gray-400"> / {cap.unit}</span>
          </div>
          {Object.keys(cap.specs).length > 0 && (
            <div className="text-[10px] text-gray-500 mt-1 space-x-2">
              {Object.entries(cap.specs).slice(0, 3).map(([k, v]) => (
                <span key={k}>
                  <span className="text-gray-400">{k}:</span> {v}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 transition-opacity"
          onClick={onDelete}
          aria-label="Delete capability"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export type { CapabilityDirection }
