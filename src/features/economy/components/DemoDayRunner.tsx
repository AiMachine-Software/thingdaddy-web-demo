import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Film, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { buildDemoDay, type DemoDayResult, type DemoDayStep } from '#/lib/economyDemoDay'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFinished?: () => void
}

const STEP_MS = 600

export default function DemoDayRunner({ open, onOpenChange, onFinished }: Props) {
  const [result, setResult] = useState<DemoDayResult | null>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (!open) {
      setResult(null)
      setActiveIdx(0)
      setFinished(false)
      return
    }
    const built = buildDemoDay()
    setResult(built)
    setActiveIdx(0)
    setFinished(false)
  }, [open])

  useEffect(() => {
    if (!result) return
    if (activeIdx >= result.steps.length) {
      setFinished(true)
      onFinished?.()
      return
    }
    const step = result.steps[activeIdx]
    try {
      step.run?.()
    } catch (err) {
      console.error('[DemoDay] step failed', err)
    }
    const t = window.setTimeout(() => setActiveIdx((i) => i + 1), STEP_MS)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, activeIdx])

  const steps: DemoDayStep[] = useMemo(() => result?.steps ?? [], [result])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-600" />
            Machine Economy Demo
          </DialogTitle>
          <DialogDescription>
            Watching two autonomous negotiations execute end-to-end.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto pt-2">
          {steps.map((step, i) => {
            const status = i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'pending'
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{
                  opacity: status === 'pending' ? 0.35 : 1,
                  y: 0,
                }}
                transition={{ duration: 0.25 }}
                className={`flex items-start gap-3 rounded-xl border p-3 ${
                  status === 'active'
                    ? 'bg-indigo-50/60 border-indigo-200'
                    : status === 'done'
                      ? 'bg-emerald-50/40 border-emerald-100'
                      : 'bg-gray-50/40 border-gray-100'
                }`}
              >
                <div className="text-xl leading-none shrink-0">
                  {status === 'done' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : step.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-gray-900">{step.label}</div>
                  <div className="text-[11px] text-gray-600 leading-snug">{step.detail}</div>
                </div>
              </motion.div>
            )
          })}
        </div>

        <DialogFooter>
          <Button
            variant={finished ? 'default' : 'ghost'}
            onClick={() => onOpenChange(false)}
          >
            {finished ? 'Close' : 'Skip'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
