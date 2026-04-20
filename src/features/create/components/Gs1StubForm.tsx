import { Construction } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { THING_TYPES_BY_CODE } from '../config/thing-types'

interface Props {
  thingTypeCode: string
  onPickAnother: () => void
}

export default function Gs1StubForm({ thingTypeCode, onPickAnother }: Props) {
  const t = THING_TYPES_BY_CODE[thingTypeCode]
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
      <div className="mx-auto w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
        <Construction className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-amber-900">
        Encoder coming soon for {t?.label ?? thingTypeCode}
      </h3>
      <p className="text-sm text-amber-800/90 mt-2 max-w-md mx-auto">
        {t?.description}. The {thingTypeCode} encoder is not yet implemented in
        this demo. Pick <strong>SGTIN</strong>, <strong>CPI</strong>,{' '}
        <strong>GIAI</strong>, or <strong>GSRN</strong> to continue.
      </p>
      {t?.aiCode && t.aiCode !== '—' && (
        <p className="mt-3 text-xs font-mono text-amber-700">{t.aiCode}</p>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={onPickAnother}
        className="mt-5"
      >
        Pick another Thing Type
      </Button>
    </div>
  )
}
