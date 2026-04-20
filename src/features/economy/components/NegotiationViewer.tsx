import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { mockDb } from '#/lib/mockDb'
import type { Negotiation, NegotiationRound } from '#/lib/negotiationEngine'

interface Props {
  negotiation: Negotiation
  /** If true, plays rounds one-by-one with a delay. Otherwise shows all instantly. */
  animate?: boolean
  stepDelayMs?: number
}

export default function NegotiationViewer({ negotiation, animate = true, stepDelayMs = 700 }: Props) {
  const [visibleCount, setVisibleCount] = useState(animate ? 0 : negotiation.rounds.length)

  useEffect(() => {
    if (!animate) {
      setVisibleCount(negotiation.rounds.length)
      return
    }
    setVisibleCount(0)
    const timers: number[] = []
    negotiation.rounds.forEach((_, i) => {
      const t = window.setTimeout(() => setVisibleCount(i + 1), (i + 1) * stepDelayMs)
      timers.push(t)
    })
    return () => {
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [negotiation.id, animate, stepDelayMs, negotiation.rounds.length])

  const buyer = mockDb.getAsset(negotiation.buyerThingId)
  const seller = mockDb.getAsset(negotiation.sellerThingId)
  const buyerLabel = buyer?.description ?? negotiation.buyerThingId
  const sellerLabel = seller?.description ?? negotiation.sellerThingId

  const visibleRounds = negotiation.rounds.slice(0, visibleCount)
  const isComplete = visibleCount === negotiation.rounds.length
  const accepted = negotiation.status === 'accepted' || negotiation.status === 'completed'

  const priceExtent = useMemo(() => {
    const prices = negotiation.rounds.map((r) => r.priceOffered)
    const min = Math.min(...prices, negotiation.sellerMinAccept)
    const max = Math.max(...prices, negotiation.listedPrice)
    return { min: min * 0.9, max: max * 1.05 }
  }, [negotiation])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 text-xs">
        <div className="flex-1 text-right">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
            Seller
          </div>
          <div className="text-sm font-bold text-gray-900 truncate">{sellerLabel}</div>
          <div className="text-[10px] text-gray-500">
            Listed {negotiation.listedPrice} TC · Min {negotiation.sellerMinAccept} TC · {negotiation.sellerStrategy}
          </div>
        </div>
        <div className="text-3xl">{negotiation.capabilityIcon}</div>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
            Buyer
          </div>
          <div className="text-sm font-bold text-gray-900 truncate">{buyerLabel}</div>
          <div className="text-[10px] text-gray-500">
            Budget {negotiation.buyerBudget} TC · {negotiation.buyerStrategy}
          </div>
        </div>
      </div>

      {/* Rounds */}
      <div className="space-y-2 min-h-[160px]">
        <AnimatePresence initial={false}>
          {visibleRounds.map((round) => (
            <RoundBubble key={round.roundNumber} round={round} unit={negotiation.unit} />
          ))}
        </AnimatePresence>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4">
        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
          Price convergence
        </div>
        <PriceChart
          rounds={visibleRounds}
          min={priceExtent.min}
          max={priceExtent.max}
          listedPrice={negotiation.listedPrice}
          sellerMin={negotiation.sellerMinAccept}
          buyerBudget={negotiation.buyerBudget}
        />
      </div>

      {isComplete && (
        <div
          className={`rounded-xl border p-4 flex items-center gap-3 ${
            accepted
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {accepted ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 shrink-0" />
          )}
          <div className="text-sm">
            {accepted ? (
              <>
                <span className="font-bold">Deal at {negotiation.agreedPrice} TC</span> /{' '}
                {negotiation.agreedUnit}
                {negotiation.contractDuration && (
                  <span className="text-xs text-emerald-700">
                    {' '}
                    · Duration: {negotiation.contractDuration}
                  </span>
                )}
              </>
            ) : (
              <span className="font-bold">Negotiation failed — no agreement reached</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function RoundBubble({ round, unit }: { round: NegotiationRound; unit: string }) {
  const isBuyer = round.proposedBy === 'buyer'
  return (
    <motion.div
      initial={{ opacity: 0, x: isBuyer ? 20 : -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isBuyer ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[70%] rounded-2xl px-3 py-2 text-xs ${
          isBuyer
            ? 'bg-sky-50 border border-sky-200 text-sky-900 rounded-br-sm'
            : 'bg-violet-50 border border-violet-200 text-violet-900 rounded-bl-sm'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-wider font-bold opacity-70">
            Round {round.roundNumber} · {isBuyer ? 'Buyer' : 'Seller'}
          </span>
        </div>
        <div className="font-semibold">
          {round.message ?? `${round.priceOffered} TC / ${unit}`}
        </div>
      </div>
    </motion.div>
  )
}

function PriceChart({
  rounds,
  min,
  max,
  listedPrice,
  sellerMin,
  buyerBudget,
}: {
  rounds: NegotiationRound[]
  min: number
  max: number
  listedPrice: number
  sellerMin: number
  buyerBudget: number
}) {
  const width = 520
  const height = 160
  const padLeft = 40
  const padRight = 12
  const padTop = 10
  const padBottom = 24
  const plotW = width - padLeft - padRight
  const plotH = height - padTop - padBottom

  const totalRounds = Math.max(rounds.length, 2)
  const xFor = (i: number) => padLeft + (plotW * i) / (totalRounds - 1)
  const yFor = (price: number) => {
    const t = (price - min) / (max - min)
    return padTop + plotH * (1 - t)
  }

  const buyerPoints = rounds
    .filter((r) => r.proposedBy === 'buyer')
    .map((r) => ({ x: xFor(r.roundNumber - 1), y: yFor(r.priceOffered) }))
  const sellerPoints = rounds
    .filter((r) => r.proposedBy === 'seller')
    .map((r) => ({ x: xFor(r.roundNumber - 1), y: yFor(r.priceOffered) }))

  const buyerPath = buyerPoints.length
    ? `M ${buyerPoints.map((p) => `${p.x},${p.y}`).join(' L ')}`
    : ''
  const sellerPath = sellerPoints.length
    ? `M ${sellerPoints.map((p) => `${p.x},${p.y}`).join(' L ')}`
    : ''

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[160px]" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines at listedPrice / sellerMin / buyerBudget */}
        <line
          x1={padLeft}
          x2={width - padRight}
          y1={yFor(listedPrice)}
          y2={yFor(listedPrice)}
          stroke="#e5e7eb"
          strokeDasharray="3 3"
        />
        <text x={padLeft - 4} y={yFor(listedPrice) + 3} textAnchor="end" fontSize="9" fill="#9ca3af">
          {listedPrice}
        </text>
        <line
          x1={padLeft}
          x2={width - padRight}
          y1={yFor(sellerMin)}
          y2={yFor(sellerMin)}
          stroke="#fecaca"
          strokeDasharray="3 3"
        />
        <text x={padLeft - 4} y={yFor(sellerMin) + 3} textAnchor="end" fontSize="9" fill="#ef4444">
          {sellerMin}
        </text>
        <line
          x1={padLeft}
          x2={width - padRight}
          y1={yFor(buyerBudget)}
          y2={yFor(buyerBudget)}
          stroke="#bae6fd"
          strokeDasharray="3 3"
        />
        <text x={padLeft - 4} y={yFor(buyerBudget) + 3} textAnchor="end" fontSize="9" fill="#0ea5e9">
          {buyerBudget}
        </text>

        {/* Round labels */}
        {Array.from({ length: totalRounds }).map((_, i) => (
          <text key={i} x={xFor(i)} y={height - 8} textAnchor="middle" fontSize="9" fill="#9ca3af">
            R{i + 1}
          </text>
        ))}

        {/* Seller line (violet, drops) */}
        {sellerPath && <path d={sellerPath} fill="none" stroke="#8b5cf6" strokeWidth="2" />}
        {sellerPoints.map((p, i) => (
          <circle key={`s-${i}`} cx={p.x} cy={p.y} r={3} fill="#8b5cf6" />
        ))}

        {/* Buyer line (sky, rises) */}
        {buyerPath && <path d={buyerPath} fill="none" stroke="#0ea5e9" strokeWidth="2" />}
        {buyerPoints.map((p, i) => (
          <circle key={`b-${i}`} cx={p.x} cy={p.y} r={3} fill="#0ea5e9" />
        ))}
      </svg>
    </div>
  )
}
