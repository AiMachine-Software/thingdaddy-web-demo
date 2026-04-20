import { Check, Save } from 'lucide-react'
import { Button } from '#/components/ui/button'

interface Props {
  onSave: () => void
  saving?: boolean
  savedAt?: number | null
}

export default function SaveBar({ onSave, saving, savedAt }: Props) {
  return (
    <div className="flex items-center justify-end gap-3 mt-6">
      {savedAt && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200">
          <Check className="w-3.5 h-3.5" />
          Saved
        </span>
      )}
      <Button onClick={onSave} disabled={saving} className="gap-1.5">
        <Save className="w-3.5 h-3.5" />
        {saving ? 'Saving…' : 'Save changes'}
      </Button>
    </div>
  )
}
