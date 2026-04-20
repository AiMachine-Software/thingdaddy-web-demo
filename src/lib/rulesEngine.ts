import { mockDb, type Asset } from './mockDb'
import { sendMessage } from './deviceMessages'
import {
  getConnectionsForThing,
  type CloudPlatform,
  type CloudConnection,
} from './cloudConnections'
import { maybeAutoActivate } from './warranty'

// ─── Types ───────────────────────────────────────────────

export type RulePriority = 'low' | 'normal' | 'high' | 'critical'

export type RuleOperator = '>' | '<' | '==' | '!=' | '>=' | '<='

export type RuleSchedule = 'always' | 'business_hours' | 'weekdays' | 'custom'

export type ActionType =
  | 'send_command'
  | 'update_status'
  | 'notification'
  | 'webhook'
  | 'audit_log'
  | 'trigger_rule'
  | 'update_metadata'
  | 'start_warranty'

export interface RuleTrigger {
  type: 'specific_thing' | 'any_matching'
  thingId?: string
  thingTypeFilter?: 'consumable' | 'wip' | 'fixed' | 'human' | ''
  statusFilter?: 'active' | 'suspended' | 'retired' | ''
  metric: string
  operator: RuleOperator
  threshold: number | string | boolean
  unit?: string
  duration?: 'immediate' | '1min' | '5min' | '15min' | '1hour'
}

export interface RuleAction {
  type: ActionType
  targetThingId?: string
  command?: string
  payload?: string
  message?: string
  webhookUrl?: string
  targetRuleId?: string
  metadataKey?: string
  metadataValue?: string
  newStatus?: 'active' | 'suspended' | 'retired'
}

export interface AutomationRule {
  id: string
  orgId: string
  name: string
  description: string
  priority: RulePriority
  enabled: boolean
  trigger: RuleTrigger
  actions: RuleAction[]
  cooldownMinutes: number
  maxTriggers: number | null
  schedule: RuleSchedule
  customCron?: string
  triggerCount: number
  lastTriggeredAt?: string
  createdAt: string
  updatedAt: string
}

export interface RuleExecution {
  id: string
  ruleId: string
  ruleName: string
  orgId: string
  triggeredAt: string
  triggerEvent: {
    thingId: string
    thingName: string
    metric: string
    value: number | string | boolean
  }
  actions: Array<{
    type: ActionType
    target: string
    status: 'success' | 'failed' | 'skipped'
    reason?: string
    latencyMs?: number
  }>
}

export interface DashboardNotification {
  id: string
  orgId: string
  ruleId?: string
  ruleName?: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  read: boolean
  createdAt: string
}

export interface SimulatedEvent {
  thingId: string
  metric: string
  value: number | string | boolean
}

export interface EvaluationResult {
  rule: AutomationRule
  matched: boolean
  reason?: string
  execution?: RuleExecution
}

// ─── Storage ─────────────────────────────────────────────

const RULES_KEY = 'automation_rules'
const EXECUTIONS_KEY = 'rule_executions'
const NOTIFICATIONS_KEY = 'dashboard_notifications'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function newId(prefix: string): string {
  return isBrowser()
    ? `${prefix}_${crypto.randomUUID()}`
    : `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function loadJson<T>(key: string): T[] {
  if (!isBrowser()) return []
  const raw = localStorage.getItem(key)
  if (!raw) return []
  try {
    return JSON.parse(raw) as T[]
  } catch {
    return []
  }
}

function saveJson<T>(key: string, data: T[]): void {
  if (!isBrowser()) return
  localStorage.setItem(key, JSON.stringify(data))
}

// Rules
export function loadRules(): AutomationRule[] {
  return loadJson<AutomationRule>(RULES_KEY)
}
export function saveRules(rules: AutomationRule[]): void {
  saveJson(RULES_KEY, rules)
}
export function getRulesForOrg(orgId: string): AutomationRule[] {
  return loadRules().filter((r) => r.orgId === orgId)
}
export function getRule(id: string): AutomationRule | undefined {
  return loadRules().find((r) => r.id === id)
}

export interface CreateRuleInput {
  orgId: string
  name: string
  description?: string
  priority?: RulePriority
  enabled?: boolean
  trigger: RuleTrigger
  actions: RuleAction[]
  cooldownMinutes?: number
  maxTriggers?: number | null
  schedule?: RuleSchedule
  customCron?: string
}

export function createRule(input: CreateRuleInput): AutomationRule {
  const now = new Date().toISOString()
  const rule: AutomationRule = {
    id: newId('rule'),
    orgId: input.orgId,
    name: input.name,
    description: input.description ?? '',
    priority: input.priority ?? 'normal',
    enabled: input.enabled ?? true,
    trigger: input.trigger,
    actions: input.actions,
    cooldownMinutes: input.cooldownMinutes ?? 0,
    maxTriggers: input.maxTriggers ?? null,
    schedule: input.schedule ?? 'always',
    customCron: input.customCron,
    triggerCount: 0,
    createdAt: now,
    updatedAt: now,
  }
  saveRules([rule, ...loadRules()])
  return rule
}

export function updateRule(
  id: string,
  updates: Partial<Omit<AutomationRule, 'id' | 'orgId' | 'createdAt'>>,
): AutomationRule | undefined {
  const all = loadRules()
  const i = all.findIndex((r) => r.id === id)
  if (i === -1) return undefined
  const next: AutomationRule = {
    ...all[i],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  all[i] = next
  saveRules(all)
  return next
}

export function deleteRule(id: string): boolean {
  const all = loadRules()
  const next = all.filter((r) => r.id !== id)
  if (next.length === all.length) return false
  saveRules(next)
  // Cascade-clean executions
  const execs = loadExecutions().filter((e) => e.ruleId !== id)
  saveJson(EXECUTIONS_KEY, execs)
  return true
}

// Executions
export function loadExecutions(): RuleExecution[] {
  return loadJson<RuleExecution>(EXECUTIONS_KEY)
}
export function saveExecutions(execs: RuleExecution[]): void {
  saveJson(EXECUTIONS_KEY, execs)
}
export function getExecutionsForRule(ruleId: string): RuleExecution[] {
  return loadExecutions()
    .filter((e) => e.ruleId === ruleId)
    .sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt))
}
export function getExecutionsForOrg(orgId: string): RuleExecution[] {
  return loadExecutions()
    .filter((e) => e.orgId === orgId)
    .sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt))
}

// Notifications
export function loadNotifications(): DashboardNotification[] {
  return loadJson<DashboardNotification>(NOTIFICATIONS_KEY)
}
export function saveNotifications(n: DashboardNotification[]): void {
  saveJson(NOTIFICATIONS_KEY, n)
}
export function getNotificationsForOrg(orgId: string): DashboardNotification[] {
  return loadNotifications()
    .filter((n) => n.orgId === orgId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
export function markNotificationRead(id: string): void {
  const all = loadNotifications()
  const i = all.findIndex((n) => n.id === id)
  if (i === -1) return
  all[i] = { ...all[i], read: true }
  saveNotifications(all)
}
export function pushNotification(
  input: Omit<DashboardNotification, 'id' | 'createdAt' | 'read'> & {
    read?: boolean
  },
): DashboardNotification {
  const note: DashboardNotification = {
    id: newId('note'),
    createdAt: new Date().toISOString(),
    read: input.read ?? false,
    ...input,
  }
  saveNotifications([note, ...loadNotifications()])
  return note
}

// ─── Constants ───────────────────────────────────────────

export const PRESET_METRICS: Array<{
  key: string
  label: string
  unit: string
  description: string
}> = [
  { key: 'temperature', label: 'Temperature', unit: '°C', description: 'Temperature reading' },
  { key: 'humidity', label: 'Humidity', unit: '%', description: 'Relative humidity' },
  { key: 'battery_level', label: 'Battery Level', unit: '%', description: 'Battery percentage' },
  { key: 'signal_strength', label: 'Signal Strength', unit: 'dBm', description: 'Network signal' },
  { key: 'power_consumption', label: 'Power Consumption', unit: 'W', description: 'Power usage' },
  { key: 'uptime', label: 'Uptime', unit: 'h', description: 'Time since last reboot' },
  { key: 'error_count', label: 'Error Count', unit: '', description: 'Cumulative errors' },
  { key: 'occupancy', label: 'Occupancy', unit: '', description: 'Presence detected' },
  { key: 'door_status', label: 'Door Status', unit: '', description: 'Door sensor open/closed' },
  { key: 'motion', label: 'Motion', unit: '', description: 'Motion detected' },
  { key: 'pressure', label: 'Pressure', unit: 'hPa', description: 'Atmospheric pressure' },
  { key: 'co2_level', label: 'CO₂ Level', unit: 'ppm', description: 'CO2 concentration' },
  { key: 'first_scan', label: 'First Scan', unit: '', description: 'First time the thing is scanned' },
  { key: 'custom', label: 'Custom', unit: '', description: 'User-defined metric' },
]

export const PRESET_COMMANDS: string[] = [
  'power_on',
  'power_off',
  'reboot',
  'set_temperature',
  'open',
  'close',
  'lock',
  'unlock',
  'start_recording',
  'sync',
  'firmware_update',
]

export const DURATION_OPTIONS: Array<{ value: NonNullable<RuleTrigger['duration']>; label: string }> = [
  { value: 'immediate', label: 'Immediately' },
  { value: '1min', label: 'For at least 1 min' },
  { value: '5min', label: 'For at least 5 min' },
  { value: '15min', label: 'For at least 15 min' },
  { value: '1hour', label: 'Average over 1 hour' },
]

export const RULE_TEMPLATES: Array<{
  id: string
  emoji: string
  title: string
  description: string
  rule: Omit<CreateRuleInput, 'orgId'>
}> = [
  {
    id: 'temp_alert',
    emoji: '🌡️',
    title: 'Temperature Alert',
    description: 'Sensor exceeds threshold → notify + send command',
    rule: {
      name: 'Temperature Alert',
      description: 'Triggers when a temperature sensor exceeds the threshold.',
      priority: 'high',
      trigger: {
        type: 'any_matching',
        thingTypeFilter: 'consumable',
        statusFilter: 'active',
        metric: 'temperature',
        operator: '>',
        threshold: 40,
        unit: '°C',
        duration: 'immediate',
      },
      actions: [
        {
          type: 'notification',
          message: 'High temperature on {thing.name}: {value}°C',
        },
      ],
      cooldownMinutes: 5,
      schedule: 'always',
    },
  },
  {
    id: 'low_battery',
    emoji: '🔋',
    title: 'Low Battery',
    description: 'Battery < 20% → notify admin',
    rule: {
      name: 'Low Battery Warning',
      description: 'Notify admin when any device battery falls below 20%.',
      priority: 'normal',
      trigger: {
        type: 'any_matching',
        thingTypeFilter: 'fixed',
        metric: 'battery_level',
        operator: '<',
        threshold: 20,
        unit: '%',
        duration: 'immediate',
      },
      actions: [
        {
          type: 'notification',
          message: '{thing.name} battery low: {value}%',
        },
      ],
      cooldownMinutes: 60,
      schedule: 'always',
    },
  },
  {
    id: 'motion_lights',
    emoji: '🚪',
    title: 'Door / Motion',
    description: 'Motion detected → turn on lights + start recording',
    rule: {
      name: 'Motion → Lights On',
      description: 'When motion is detected, send power_on command.',
      priority: 'normal',
      trigger: {
        type: 'any_matching',
        metric: 'motion',
        operator: '==',
        threshold: true,
        duration: 'immediate',
      },
      actions: [
        { type: 'send_command', command: 'power_on', payload: '{"command":"power_on"}' },
        { type: 'notification', message: 'Motion detected on {thing.name}' },
      ],
      cooldownMinutes: 1,
      schedule: 'always',
    },
  },
  {
    id: 'scheduled_report',
    emoji: '⏰',
    title: 'Scheduled Report',
    description: 'Every day at 8:00 → collect data + notify',
    rule: {
      name: 'Daily Sensor Report',
      description: 'Send a summary notification at the start of each business day.',
      priority: 'low',
      trigger: {
        type: 'any_matching',
        metric: 'uptime',
        operator: '>',
        threshold: 0,
        duration: 'immediate',
      },
      actions: [{ type: 'notification', message: 'Daily sensor report ready' }],
      cooldownMinutes: 1440,
      schedule: 'business_hours',
    },
  },
  {
    id: 'warranty_auto',
    emoji: '🛡️',
    title: 'Warranty Auto-Start',
    description: 'First scan detected → activate warranty',
    rule: {
      name: 'Warranty Auto-Activate',
      description: 'When a thing is first scanned, auto-activate its warranty.',
      priority: 'normal',
      trigger: {
        type: 'any_matching',
        metric: 'first_scan',
        operator: '==',
        threshold: true,
        duration: 'immediate',
      },
      actions: [{ type: 'start_warranty' }],
      cooldownMinutes: 0,
      maxTriggers: null,
      schedule: 'always',
    },
  },
  {
    id: 'cross_cloud_sync',
    emoji: '🔄',
    title: 'Cross-Cloud Sync',
    description: 'Azure twin updated → sync to AWS shadow',
    rule: {
      name: 'Cross-Cloud Sync',
      description: 'Mirror device twin updates from Azure to AWS shadow.',
      priority: 'normal',
      trigger: {
        type: 'any_matching',
        metric: 'custom',
        operator: '==',
        threshold: 'updated',
        duration: 'immediate',
      },
      actions: [{ type: 'send_command', command: 'sync', payload: '{"command":"sync"}' }],
      cooldownMinutes: 0,
      schedule: 'always',
    },
  },
]

// ─── Engine ──────────────────────────────────────────────

function compareValues(
  a: number | string | boolean,
  op: RuleOperator,
  b: number | string | boolean,
): boolean {
  // Coerce booleans to numbers when comparing with numbers
  if (typeof a === 'boolean' || typeof b === 'boolean') {
    const av = a ? 1 : 0
    const bv = b ? 1 : 0
    switch (op) {
      case '==':
        return a === b || av === bv
      case '!=':
        return !(a === b || av === bv)
      case '>':
        return av > bv
      case '<':
        return av < bv
      case '>=':
        return av >= bv
      case '<=':
        return av <= bv
    }
  }
  if (typeof a === 'number' && typeof b === 'number') {
    switch (op) {
      case '>':
        return a > b
      case '<':
        return a < b
      case '>=':
        return a >= b
      case '<=':
        return a <= b
      case '==':
        return a === b
      case '!=':
        return a !== b
    }
  }
  // Fallback string compare
  const sa = String(a)
  const sb = String(b)
  switch (op) {
    case '==':
      return sa === sb
    case '!=':
      return sa !== sb
    case '>':
      return sa > sb
    case '<':
      return sa < sb
    case '>=':
      return sa >= sb
    case '<=':
      return sa <= sb
  }
  return false
}

function isScheduleActive(rule: AutomationRule, now: Date = new Date()): boolean {
  switch (rule.schedule) {
    case 'always':
      return true
    case 'business_hours': {
      const h = now.getHours()
      const d = now.getDay()
      return d >= 1 && d <= 5 && h >= 9 && h < 17
    }
    case 'weekdays': {
      const d = now.getDay()
      return d >= 1 && d <= 5
    }
    case 'custom':
      return true
  }
}

function isInCooldown(rule: AutomationRule, now: Date = new Date()): boolean {
  if (!rule.cooldownMinutes || !rule.lastTriggeredAt) return false
  const last = new Date(rule.lastTriggeredAt).getTime()
  return now.getTime() - last < rule.cooldownMinutes * 60_000
}

function reachedMaxTriggers(rule: AutomationRule): boolean {
  return rule.maxTriggers != null && rule.triggerCount >= rule.maxTriggers
}

function thingMatchesTrigger(asset: Asset, trigger: RuleTrigger): boolean {
  if (trigger.type === 'specific_thing') {
    return trigger.thingId === asset.id
  }
  if (trigger.thingTypeFilter && asset.type !== trigger.thingTypeFilter) return false
  if (trigger.statusFilter && (asset.status ?? 'active') !== trigger.statusFilter) return false
  return true
}

function pickPlatform(thingId: string): CloudPlatform | null {
  const conns = getConnectionsForThing(thingId)
  return conns[0]?.platform ?? null
}

function interpolate(
  template: string,
  asset: Asset | undefined,
  event: SimulatedEvent,
): string {
  return template
    .replace(/\{thing\.name\}/g, asset?.description ?? asset?.namespace ?? event.thingId)
    .replace(/\{thing\.id\}/g, asset?.id ?? event.thingId)
    .replace(/\{value\}/g, String(event.value))
    .replace(/\{metric\}/g, event.metric)
}

function executeActionsInternal(
  rule: AutomationRule,
  event: SimulatedEvent,
  asset: Asset | undefined,
  depth: number,
): RuleExecution['actions'] {
  const results: RuleExecution['actions'] = []

  for (const action of rule.actions) {
    const start = performance?.now?.() ?? Date.now()
    try {
      switch (action.type) {
        case 'send_command': {
          const target = action.targetThingId
            ? mockDb.getAsset(action.targetThingId)
            : undefined
          if (!target) {
            results.push({
              type: action.type,
              target: action.targetThingId ?? '—',
              status: 'failed',
              reason: 'target thing not found',
            })
            break
          }
          const fromPlatform = pickPlatform(event.thingId) ?? 'custom'
          const toPlatform = pickPlatform(target.id) ?? 'custom'
          const msg = sendMessage({
            orgId: rule.orgId,
            fromThingId: event.thingId,
            fromCloud: fromPlatform,
            toThingId: target.id,
            toCloud: toPlatform,
            protocol: 'mqtt',
            topic: `thingdaddy/rules/${rule.id}/command`,
            payload: action.payload ?? JSON.stringify({ command: action.command ?? 'noop' }),
          })
          results.push({
            type: action.type,
            target: `${target.description ?? target.namespace} (${action.command ?? 'cmd'})`,
            status: 'success',
            latencyMs: msg.latencyMs,
          })
          break
        }
        case 'notification': {
          const message = interpolate(
            action.message ?? `${rule.name} triggered`,
            asset,
            event,
          )
          pushNotification({
            orgId: rule.orgId,
            ruleId: rule.id,
            ruleName: rule.name,
            message,
            severity:
              rule.priority === 'critical'
                ? 'critical'
                : rule.priority === 'high'
                  ? 'warning'
                  : 'info',
          })
          results.push({
            type: action.type,
            target: 'dashboard',
            status: 'success',
            latencyMs: 1,
          })
          break
        }
        case 'audit_log': {
          mockDb.addAuditLog({
            action: 'updated',
            thingId: event.thingId,
            thingName: asset?.namespace,
            orgId: rule.orgId,
            details: {
              source: 'rules_engine',
              ruleId: rule.id,
              ruleName: rule.name,
              metric: event.metric,
              value: event.value,
            },
          })
          results.push({
            type: action.type,
            target: 'audit_log',
            status: 'success',
            latencyMs: 1,
          })
          break
        }
        case 'update_status': {
          const id = action.targetThingId ?? event.thingId
          if (action.newStatus) {
            mockDb.updateAssetStatus(id, action.newStatus)
            results.push({
              type: action.type,
              target: `${id} → ${action.newStatus}`,
              status: 'success',
            })
          } else {
            results.push({
              type: action.type,
              target: id,
              status: 'failed',
              reason: 'missing newStatus',
            })
          }
          break
        }
        case 'update_metadata': {
          const id = action.targetThingId ?? event.thingId
          if (action.metadataKey) {
            mockDb.updateAsset(id, {
              [action.metadataKey]: action.metadataValue,
            } as Partial<Asset>)
            results.push({
              type: action.type,
              target: `${id}.${action.metadataKey}`,
              status: 'success',
            })
          } else {
            results.push({
              type: action.type,
              target: id,
              status: 'failed',
              reason: 'missing metadataKey',
            })
          }
          break
        }
        case 'webhook': {
          results.push({
            type: action.type,
            target: action.webhookUrl ?? '—',
            status: 'success',
            reason: 'simulated POST',
            latencyMs: 50,
          })
          break
        }
        case 'start_warranty': {
          const id = action.targetThingId ?? event.thingId
          const target = mockDb.getAsset(id)
          if (!target) {
            results.push({
              type: action.type,
              target: id,
              status: 'failed',
              reason: 'target not found',
            })
            break
          }
          const { justActivated } = maybeAutoActivate(target)
          results.push({
            type: action.type,
            target: target.description ?? target.namespace,
            status: justActivated ? 'success' : 'skipped',
            reason: justActivated ? undefined : 'warranty already active or not eligible',
          })
          break
        }
        case 'trigger_rule': {
          if (depth >= 3) {
            results.push({
              type: action.type,
              target: action.targetRuleId ?? '—',
              status: 'skipped',
              reason: 'max recursion depth',
            })
            break
          }
          const targetRule = action.targetRuleId ? getRule(action.targetRuleId) : undefined
          if (!targetRule) {
            results.push({
              type: action.type,
              target: action.targetRuleId ?? '—',
              status: 'failed',
              reason: 'rule not found',
            })
            break
          }
          executeActionsInternal(targetRule, event, asset, depth + 1)
          results.push({
            type: action.type,
            target: targetRule.name,
            status: 'success',
          })
          break
        }
      }
    } catch (err) {
      results.push({
        type: action.type,
        target: '—',
        status: 'failed',
        reason: (err as Error).message,
      })
    }
    const end = performance?.now?.() ?? Date.now()
    const last = results[results.length - 1]
    if (last && last.latencyMs == null) last.latencyMs = Math.max(1, Math.round(end - start))
  }

  return results
}

export function evaluateEvent(
  event: SimulatedEvent,
  orgId: string,
): EvaluationResult[] {
  const rules = getRulesForOrg(orgId)
  const asset = mockDb.getAsset(event.thingId)
  const results: EvaluationResult[] = []

  for (const ruleSnapshot of rules) {
    // Re-load each rule before mutating to keep cooldown counters accurate
    const rule = getRule(ruleSnapshot.id) ?? ruleSnapshot

    if (!rule.enabled) {
      results.push({ rule, matched: false, reason: 'rule paused' })
      continue
    }
    if (rule.trigger.metric !== event.metric) {
      results.push({ rule, matched: false, reason: 'metric mismatch' })
      continue
    }
    if (!asset) {
      results.push({ rule, matched: false, reason: 'unknown source thing' })
      continue
    }
    if (!thingMatchesTrigger(asset, rule.trigger)) {
      results.push({ rule, matched: false, reason: 'trigger filter excluded' })
      continue
    }
    if (!compareValues(event.value, rule.trigger.operator, rule.trigger.threshold)) {
      results.push({ rule, matched: false, reason: 'threshold not met' })
      continue
    }
    if (!isScheduleActive(rule)) {
      results.push({ rule, matched: false, reason: 'outside schedule' })
      continue
    }
    if (isInCooldown(rule)) {
      results.push({ rule, matched: false, reason: 'cooldown active' })
      continue
    }
    if (reachedMaxTriggers(rule)) {
      results.push({ rule, matched: false, reason: 'max triggers reached' })
      continue
    }

    // MATCH — execute actions
    const actionResults = executeActionsInternal(rule, event, asset, 0)
    const exec: RuleExecution = {
      id: newId('exec'),
      ruleId: rule.id,
      ruleName: rule.name,
      orgId: rule.orgId,
      triggeredAt: new Date().toISOString(),
      triggerEvent: {
        thingId: event.thingId,
        thingName: asset.description ?? asset.namespace,
        metric: event.metric,
        value: event.value,
      },
      actions: actionResults,
    }
    saveExecutions([exec, ...loadExecutions()])
    updateRule(rule.id, {
      triggerCount: rule.triggerCount + 1,
      lastTriggeredAt: exec.triggeredAt,
    })
    results.push({ rule, matched: true, execution: exec })
  }

  return results
}

// Re-export connection helper for components that show platforms in flow diagrams
export function getConnectionForThing(thingId: string): CloudConnection | undefined {
  return getConnectionsForThing(thingId)[0]
}
