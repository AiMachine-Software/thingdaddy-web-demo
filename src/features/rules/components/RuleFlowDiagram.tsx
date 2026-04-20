import { motion } from 'motion/react'
import { ArrowRight, Cpu, Server, Bell, Database, Shield, Webhook, RefreshCw, Settings as SettingsIcon } from 'lucide-react'
import type { AutomationRule, RuleAction } from '#/lib/rulesEngine'
import { mockDb } from '#/lib/mockDb'
import { getConnectionsForThing } from '#/lib/cloudConnections'
import CloudBadge from '#/features/cloud/components/CloudBadge'

interface Props {
  rule: AutomationRule
  simulating?: boolean
}

const ACTION_ICON: Record<RuleAction['type'], typeof Bell> = {
  send_command: Cpu,
  notification: Bell,
  audit_log: Database,
  start_warranty: Shield,
  webhook: Webhook,
  trigger_rule: RefreshCw,
  update_status: SettingsIcon,
  update_metadata: SettingsIcon,
}

function actionLabel(a: RuleAction): string {
  switch (a.type) {
    case 'send_command':
      return a.command ?? 'command'
    case 'notification':
      return 'notification'
    case 'audit_log':
      return 'audit log'
    case 'start_warranty':
      return 'start warranty'
    case 'webhook':
      return 'webhook'
    case 'trigger_rule':
      return 'trigger rule'
    case 'update_status':
      return `status → ${a.newStatus ?? '?'}`
    case 'update_metadata':
      return `set ${a.metadataKey ?? '?'}`
  }
}

export default function RuleFlowDiagram({ rule, simulating }: Props) {
  const sourceAsset =
    rule.trigger.type === 'specific_thing' && rule.trigger.thingId
      ? mockDb.getAsset(rule.trigger.thingId)
      : undefined
  const sourceName = sourceAsset?.description ?? sourceAsset?.namespace ?? 'Any matching Thing'
  const sourcePlatform = sourceAsset
    ? getConnectionsForThing(sourceAsset.id)[0]?.platform
    : undefined

  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-sky-50/40 p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700">
          Rule Flow
        </h4>
        {simulating && (
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 animate-pulse">
            ● simulating
          </span>
        )}
      </div>

      <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
        {/* Source */}
        <Node
          icon={<Cpu className="w-4 h-4" />}
          title={sourceName}
          subtitle="Trigger source"
          badge={sourcePlatform ? <CloudBadge platform={sourcePlatform} size="xs" /> : null}
        />

        <Edge label={`${rule.trigger.metric} ${rule.trigger.operator} ${String(rule.trigger.threshold)}${rule.trigger.unit ?? ''}`} animate={simulating} />

        {/* ThingDaddy Engine */}
        <Node
          icon={<Server className="w-4 h-4 text-indigo-600" />}
          title={<span className="text-indigo-700 font-bold">ThingDaddy Rules</span>}
          subtitle="Engine"
          highlight
        />

        {/* Fan-out edge */}
        <div className="flex flex-col items-center justify-center text-gray-400 shrink-0">
          <ArrowRight className="w-4 h-4" />
          <span className="text-[9px] uppercase tracking-wider text-gray-400 mt-1">
            ✓ {rule.actions.length} action{rule.actions.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {rule.actions.map((a, i) => {
            const Icon = ACTION_ICON[a.type] ?? Bell
            const targetAsset = a.targetThingId ? mockDb.getAsset(a.targetThingId) : undefined
            const targetPlatform = targetAsset
              ? getConnectionsForThing(targetAsset.id)[0]?.platform
              : undefined
            return (
              <motion.div
                key={i}
                initial={simulating ? { opacity: 0, x: -10 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
              >
                <Node
                  icon={<Icon className="w-4 h-4" />}
                  title={targetAsset?.description ?? targetAsset?.namespace ?? actionLabel(a)}
                  subtitle={actionLabel(a)}
                  badge={targetPlatform ? <CloudBadge platform={targetPlatform} size="xs" /> : null}
                />
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Node({
  icon,
  title,
  subtitle,
  highlight,
  badge,
}: {
  icon: React.ReactNode
  title: React.ReactNode
  subtitle: string
  highlight?: boolean
  badge?: React.ReactNode
}) {
  return (
    <div
      className={`shrink-0 min-w-[140px] max-w-[180px] rounded-xl border p-3 text-center ${
        highlight
          ? 'bg-white border-indigo-300 shadow-sm shadow-indigo-100'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex justify-center mb-1.5 text-gray-500">{icon}</div>
      <div className="text-[11px] font-semibold text-gray-800 truncate">{title}</div>
      <div className="text-[9px] uppercase tracking-wider text-gray-400 mt-0.5">
        {subtitle}
      </div>
      {badge && <div className="mt-1.5 flex justify-center">{badge}</div>}
    </div>
  )
}

function Edge({ label, animate }: { label: string; animate?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center text-gray-400 shrink-0">
      <span
        className={`text-[9px] font-bold uppercase tracking-wider rounded-full px-1.5 py-0.5 mb-1 border ${
          animate
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse'
            : 'bg-white text-indigo-500 border-indigo-100'
        }`}
      >
        {label}
      </span>
      <ArrowRight className="w-4 h-4" />
    </div>
  )
}
