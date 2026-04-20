import { Wallet, TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface Props {
  orgTotal: number
  earnedToday: number
  spentToday: number
  activeServices: number
}

export default function EconomyStatCards({ orgTotal, earnedToday, spentToday, activeServices }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Stat
        icon={<Wallet className="w-5 h-5" />}
        iconColor="bg-amber-50 text-amber-600"
        label="Organization Total"
        value={format(orgTotal)}
        suffix="TC"
      />
      <Stat
        icon={<TrendingUp className="w-5 h-5" />}
        iconColor="bg-emerald-50 text-emerald-600"
        label="Earned Today"
        value={`+${format(earnedToday)}`}
        suffix="TC"
      />
      <Stat
        icon={<TrendingDown className="w-5 h-5" />}
        iconColor="bg-rose-50 text-rose-600"
        label="Spent Today"
        value={`-${format(spentToday)}`}
        suffix="TC"
      />
      <Stat
        icon={<Activity className="w-5 h-5" />}
        iconColor="bg-indigo-50 text-indigo-600"
        label="Active Services"
        value={String(activeServices)}
      />
    </div>
  )
}

function Stat({
  icon,
  iconColor,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode
  iconColor: string
  label: string
  value: string
  suffix?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
      </div>
      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">
        {value}
        {suffix && <span className="text-sm font-semibold text-gray-500 ml-1">{suffix}</span>}
      </div>
    </div>
  )
}

function format(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}
