import { mockDb } from './mockDb'
import {
  loadRules,
  saveRules,
  loadExecutions,
  saveExecutions,
  loadNotifications,
  saveNotifications,
  type AutomationRule,
  type RuleExecution,
  type DashboardNotification,
} from './rulesEngine'

const SEED_FLAG_KEY = 'thingdaddy.rules.seed.v1'
const MILESIGHT_ORG_ID = 'org_00000006-0000-0000-0000-000000000006'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function seedRulesDemo(): void {
  if (!isBrowser()) return
  if (localStorage.getItem(SEED_FLAG_KEY) === '1') return

  const milesightAssets = mockDb.getAssets(MILESIGHT_ORG_ID)
  if (milesightAssets.length === 0) return

  const existing = loadRules()
  if (existing.some((r) => r.id.startsWith('rule_seed_'))) {
    localStorage.setItem(SEED_FLAG_KEY, '1')
    return
  }

  // Locate VS-121 (occupancy sensor) and a fixed asset to use as the AC target proxy
  const vs121 =
    milesightAssets.find((a) => /VS121/i.test(a.description ?? '')) ??
    milesightAssets.find((a) => a.type === 'consumable')
  const acTarget =
    milesightAssets.find((a) => /UC300|UC100/i.test(a.description ?? '')) ??
    milesightAssets.find((a) => a.type === 'fixed')

  if (!vs121 || !acTarget) {
    localStorage.setItem(SEED_FLAG_KEY, '1')
    return
  }

  const baseDate = new Date('2026-04-07T14:30:00Z')
  const iso = (offsetMinutes: number) =>
    new Date(baseDate.getTime() - offsetMinutes * 60_000).toISOString()

  const rules: AutomationRule[] = [
    {
      id: 'rule_seed_high_temp',
      orgId: MILESIGHT_ORG_ID,
      name: 'High Temperature Alert',
      description: 'Auto-cool the server room when the VS-121 sensor reads above 40°C.',
      priority: 'high',
      enabled: true,
      trigger: {
        type: 'specific_thing',
        thingId: vs121.id,
        metric: 'temperature',
        operator: '>',
        threshold: 40,
        unit: '°C',
        duration: 'immediate',
      },
      actions: [
        {
          type: 'send_command',
          targetThingId: acTarget.id,
          command: 'power_on',
          payload: '{"command":"power_on"}',
        },
        {
          type: 'notification',
          message: 'High temperature on {thing.name}: {value}°C',
        },
      ],
      cooldownMinutes: 5,
      maxTriggers: null,
      schedule: 'always',
      triggerCount: 3,
      lastTriggeredAt: iso(120),
      createdAt: '2025-12-01T08:00:00Z',
      updatedAt: '2026-04-01T08:00:00Z',
    },
    {
      id: 'rule_seed_low_battery',
      orgId: MILESIGHT_ORG_ID,
      name: 'Low Battery Warning',
      description: 'Notify when any fixed asset (gateway/controller) battery falls below 20%.',
      priority: 'normal',
      enabled: false,
      trigger: {
        type: 'any_matching',
        thingTypeFilter: 'fixed',
        statusFilter: 'active',
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
      maxTriggers: null,
      schedule: 'always',
      triggerCount: 1,
      lastTriggeredAt: iso(60 * 24),
      createdAt: '2026-01-15T08:00:00Z',
      updatedAt: '2026-03-20T08:00:00Z',
    },
    {
      id: 'rule_seed_warranty_auto',
      orgId: MILESIGHT_ORG_ID,
      name: 'Warranty Auto-Activate',
      description: 'When a Thing is first scanned, auto-activate its consumer warranty.',
      priority: 'normal',
      enabled: true,
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
      triggerCount: 0,
      createdAt: '2026-02-01T08:00:00Z',
      updatedAt: '2026-02-01T08:00:00Z',
    },
  ]

  saveRules([...rules, ...existing])

  // Pre-seeded executions
  const executions: RuleExecution[] = [
    {
      id: 'exec_seed_temp_1',
      ruleId: 'rule_seed_high_temp',
      ruleName: 'High Temperature Alert',
      orgId: MILESIGHT_ORG_ID,
      triggeredAt: iso(120),
      triggerEvent: {
        thingId: vs121.id,
        thingName: vs121.description ?? vs121.namespace,
        metric: 'temperature',
        value: 45,
      },
      actions: [
        { type: 'send_command', target: `${acTarget.description ?? acTarget.namespace} (power_on)`, status: 'success', latencyMs: 12 },
        { type: 'notification', target: 'dashboard', status: 'success', latencyMs: 1 },
      ],
    },
    {
      id: 'exec_seed_temp_2',
      ruleId: 'rule_seed_high_temp',
      ruleName: 'High Temperature Alert',
      orgId: MILESIGHT_ORG_ID,
      triggeredAt: iso(60 * 5),
      triggerEvent: {
        thingId: vs121.id,
        thingName: vs121.description ?? vs121.namespace,
        metric: 'temperature',
        value: 42,
      },
      actions: [
        { type: 'send_command', target: `${acTarget.description ?? acTarget.namespace} (power_on)`, status: 'success', latencyMs: 18 },
        { type: 'notification', target: 'dashboard', status: 'success', latencyMs: 1 },
      ],
    },
    {
      id: 'exec_seed_temp_3',
      ruleId: 'rule_seed_high_temp',
      ruleName: 'High Temperature Alert',
      orgId: MILESIGHT_ORG_ID,
      triggeredAt: iso(60 * 16),
      triggerEvent: {
        thingId: vs121.id,
        thingName: vs121.description ?? vs121.namespace,
        metric: 'temperature',
        value: 41,
      },
      actions: [
        { type: 'send_command', target: `${acTarget.description ?? acTarget.namespace} (power_on)`, status: 'success', latencyMs: 15 },
        { type: 'notification', target: 'dashboard', status: 'skipped', reason: 'cooldown active' },
      ],
    },
    {
      id: 'exec_seed_battery_1',
      ruleId: 'rule_seed_low_battery',
      ruleName: 'Low Battery Warning',
      orgId: MILESIGHT_ORG_ID,
      triggeredAt: iso(60 * 24),
      triggerEvent: {
        thingId: acTarget.id,
        thingName: acTarget.description ?? acTarget.namespace,
        metric: 'battery_level',
        value: 18,
      },
      actions: [{ type: 'notification', target: 'dashboard', status: 'success', latencyMs: 1 }],
    },
  ]

  saveExecutions([...executions, ...loadExecutions()])

  // Pre-seeded dashboard notifications
  const notifications: DashboardNotification[] = [
    {
      id: 'note_seed_1',
      orgId: MILESIGHT_ORG_ID,
      ruleId: 'rule_seed_high_temp',
      ruleName: 'High Temperature Alert',
      message: `High temperature on ${vs121.description ?? vs121.namespace}: 45°C`,
      severity: 'warning',
      read: false,
      createdAt: iso(120),
    },
    {
      id: 'note_seed_2',
      orgId: MILESIGHT_ORG_ID,
      ruleId: 'rule_seed_high_temp',
      ruleName: 'High Temperature Alert',
      message: `${acTarget.description ?? acTarget.namespace} powered on automatically`,
      severity: 'info',
      read: false,
      createdAt: iso(120),
    },
    {
      id: 'note_seed_3',
      orgId: MILESIGHT_ORG_ID,
      ruleId: 'rule_seed_low_battery',
      ruleName: 'Low Battery Warning',
      message: `${acTarget.description ?? acTarget.namespace} battery low: 18%`,
      severity: 'warning',
      read: false,
      createdAt: iso(60 * 5),
    },
    {
      id: 'note_seed_4',
      orgId: MILESIGHT_ORG_ID,
      message: 'Gateway UG67-Rooftop back online',
      severity: 'info',
      read: true,
      createdAt: iso(60 * 24),
    },
    {
      id: 'note_seed_5',
      orgId: MILESIGHT_ORG_ID,
      message: 'Firmware update completed on 12 devices',
      severity: 'info',
      read: true,
      createdAt: iso(60 * 30),
    },
  ]

  saveNotifications([...notifications, ...loadNotifications()])

  localStorage.setItem(SEED_FLAG_KEY, '1')
}
