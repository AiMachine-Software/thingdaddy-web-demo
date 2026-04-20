import { useEffect, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'motion/react'
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Plus,
  Trash2,
  Play,
} from 'lucide-react'
import {
  createRule,
  updateRule,
  getRule,
  PRESET_METRICS,
  PRESET_COMMANDS,
  DURATION_OPTIONS,
  type CreateRuleInput,
  type RuleAction,
  type RuleTrigger,
  type ActionType,
  type RuleOperator,
  type RulePriority,
  type RuleSchedule,
} from '#/lib/rulesEngine'
import { getCurrentOrgId } from '#/lib/tenant'
import TemplateGrid from '../components/TemplateGrid'
import ThingPicker from '../components/ThingPicker'
import { validateRule } from '../lib/validation'

interface Props {
  mode: 'create' | 'edit'
}

const STEPS = ['Name', 'Trigger', 'Actions', 'Settings'] as const

const EMPTY_TRIGGER: RuleTrigger = {
  type: 'specific_thing',
  thingId: '',
  thingTypeFilter: '',
  statusFilter: 'active',
  metric: 'temperature',
  operator: '>',
  threshold: 40,
  unit: '°C',
  duration: 'immediate',
}

const EMPTY_ACTION: RuleAction = {
  type: 'notification',
  message: 'Triggered: {thing.name} {metric} = {value}',
}

export default function RuleBuilderPage({ mode }: Props) {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { ruleId?: string }
  const orgId = getCurrentOrgId() ?? ''

  const [step, setStep] = useState<number>(mode === 'create' ? -1 : 0) // -1 = template picker
  const [form, setForm] = useState<CreateRuleInput>({
    orgId,
    name: '',
    description: '',
    priority: 'normal',
    enabled: true,
    trigger: { ...EMPTY_TRIGGER },
    actions: [{ ...EMPTY_ACTION }],
    cooldownMinutes: 5,
    maxTriggers: null,
    schedule: 'always',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Edit mode: load existing rule
  useEffect(() => {
    if (mode !== 'edit' || !params.ruleId) return
    const r = getRule(params.ruleId)
    if (!r) return
    setForm({
      orgId: r.orgId,
      name: r.name,
      description: r.description,
      priority: r.priority,
      enabled: r.enabled,
      trigger: r.trigger,
      actions: r.actions,
      cooldownMinutes: r.cooldownMinutes,
      maxTriggers: r.maxTriggers,
      schedule: r.schedule,
      customCron: r.customCron,
    })
  }, [mode, params.ruleId])

  const setTrigger = (patch: Partial<RuleTrigger>) =>
    setForm((f) => ({ ...f, trigger: { ...f.trigger, ...patch } }))

  const setAction = (i: number, patch: Partial<RuleAction>) =>
    setForm((f) => ({
      ...f,
      actions: f.actions.map((a, idx) => (idx === i ? { ...a, ...patch } : a)),
    }))

  const addAction = () =>
    setForm((f) => ({ ...f, actions: [...f.actions, { ...EMPTY_ACTION }] }))

  const removeAction = (i: number) =>
    setForm((f) => ({ ...f, actions: f.actions.filter((_, idx) => idx !== i) }))

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1))
  const prev = () => setStep((s) => Math.max(-1, s - 1))

  const handleSave = (alsoTest?: boolean) => {
    const errs = validateRule(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    if (mode === 'edit' && params.ruleId) {
      updateRule(params.ruleId, {
        name: form.name,
        description: form.description ?? '',
        priority: form.priority ?? 'normal',
        enabled: form.enabled ?? true,
        trigger: form.trigger,
        actions: form.actions,
        cooldownMinutes: form.cooldownMinutes ?? 0,
        maxTriggers: form.maxTriggers ?? null,
        schedule: form.schedule ?? 'always',
        customCron: form.customCron,
      })
      navigate({ to: '/rules/$ruleId', params: { ruleId: params.ruleId } })
    } else {
      const created = createRule({ ...form, orgId })
      if (alsoTest) {
        navigate({ to: '/rules/$ruleId', params: { ruleId: created.id } })
      } else {
        navigate({ to: '/rules' })
      }
    }
  }

  // ─── Template picker step (-1) ───
  if (step === -1 && mode === 'create') {
    return (
      <main className="min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <button
          type="button"
          onClick={() => navigate({ to: '/rules' })}
          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-4"
        >
          <ChevronLeft size={14} /> Back to Rules
        </button>
        <TemplateGrid
          onPick={(tpl) => {
            setForm((f) => ({
              ...f,
              ...tpl,
              orgId,
            }))
            setStep(0)
          }}
          onSkip={() => setStep(0)}
        />
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
      <button
        type="button"
        onClick={() => navigate({ to: '/rules' })}
        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-4"
      >
        <ChevronLeft size={14} /> Back to Rules
      </button>

      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">
        {mode === 'edit' ? 'Edit Rule' : 'Create New Rule'}
      </h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold transition ${
                i <= step
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px]">
                {i + 1}
              </span>
              {label}
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px bg-gray-200" />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Name & Description</h2>
              <div className="space-y-4">
                <Field label="Rule Name" error={errors.name}>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. High Temperature Alert"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    value={form.description ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="What does this rule do?"
                    rows={2}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </Field>
                <Field label="Priority">
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as RulePriority }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </Field>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                <span className="text-amber-600">IF</span> — Trigger
              </h2>
              <div className="space-y-4">
                <Field label="Source Type">
                  <div className="flex gap-2">
                    {(['specific_thing', 'any_matching'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTrigger({ type: t })}
                        className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg border transition ${
                          form.trigger.type === t
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        {t === 'specific_thing' ? 'Specific Thing' : 'Any Matching'}
                      </button>
                    ))}
                  </div>
                </Field>

                {form.trigger.type === 'specific_thing' ? (
                  <Field label="Source Thing" error={errors.triggerThing}>
                    <ThingPicker
                      orgId={orgId}
                      value={form.trigger.thingId}
                      onChange={(id) => setTrigger({ thingId: id })}
                    />
                  </Field>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Type Filter">
                      <select
                        value={form.trigger.thingTypeFilter ?? ''}
                        onChange={(e) => setTrigger({ thingTypeFilter: e.target.value as any })}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
                      >
                        <option value="">Any type</option>
                        <option value="consumable">Consumable (SGTIN)</option>
                        <option value="wip">Work in Progress (CPI)</option>
                        <option value="fixed">Fixed Asset (GIAI)</option>
                        <option value="human">Human Resource (GSRN)</option>
                      </select>
                    </Field>
                    <Field label="Status Filter">
                      <select
                        value={form.trigger.statusFilter ?? ''}
                        onChange={(e) => setTrigger({ statusFilter: e.target.value as any })}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
                      >
                        <option value="">Any status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="retired">Retired</option>
                      </select>
                    </Field>
                  </div>
                )}

                <Field label="Metric" error={errors.metric}>
                  <select
                    value={form.trigger.metric}
                    onChange={(e) => setTrigger({ metric: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
                  >
                    {PRESET_METRICS.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="grid grid-cols-3 gap-3">
                  <Field label="Operator">
                    <select
                      value={form.trigger.operator}
                      onChange={(e) => setTrigger({ operator: e.target.value as RuleOperator })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
                    >
                      {(['>', '<', '==', '!=', '>=', '<='] as const).map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Threshold" error={errors.threshold}>
                    <input
                      value={String(form.trigger.threshold)}
                      onChange={(e) => {
                        const v = e.target.value
                        const num = Number(v)
                        setTrigger({
                          threshold:
                            v === 'true'
                              ? true
                              : v === 'false'
                                ? false
                                : Number.isFinite(num) && v.trim() !== ''
                                  ? num
                                  : v,
                        })
                      }}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </Field>
                  <Field label="Unit">
                    <input
                      value={form.trigger.unit ?? ''}
                      onChange={(e) => setTrigger({ unit: e.target.value })}
                      placeholder="°C, %, …"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </Field>
                </div>

                <Field label="Duration">
                  <select
                    value={form.trigger.duration ?? 'immediate'}
                    onChange={(e) => setTrigger({ duration: e.target.value as any })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
                  >
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                <span className="text-indigo-600">THEN</span> — Actions
              </h2>
              {errors.actions && (
                <p className="text-xs text-red-600 mb-2">{errors.actions}</p>
              )}
              <div className="space-y-4">
                {form.actions.map((a, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Action {i + 1}
                      </span>
                      {form.actions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAction(i)}
                          className="text-gray-400 hover:text-red-600"
                          aria-label="Remove action"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <Field label="Action Type">
                      <select
                        value={a.type}
                        onChange={(e) => setAction(i, { type: e.target.value as ActionType })}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
                      >
                        <option value="send_command">Send command to Thing</option>
                        <option value="notification">Dashboard notification</option>
                        <option value="audit_log">Log to audit</option>
                        <option value="update_status">Update Thing status</option>
                        <option value="update_metadata">Update Thing metadata</option>
                        <option value="webhook">Webhook (display only)</option>
                        <option value="start_warranty">Start warranty</option>
                        <option value="trigger_rule">Trigger another rule</option>
                      </select>
                    </Field>

                    {a.type === 'send_command' && (
                      <>
                        <Field label="Target Thing" error={errors[`action_${i}_target`]}>
                          <ThingPicker
                            orgId={orgId}
                            value={a.targetThingId}
                            onChange={(id) => setAction(i, { targetThingId: id })}
                          />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Command">
                            <select
                              value={a.command ?? ''}
                              onChange={(e) => setAction(i, { command: e.target.value })}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
                            >
                              <option value="">— Pick command —</option>
                              {PRESET_COMMANDS.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Payload (JSON)">
                            <input
                              value={a.payload ?? ''}
                              onChange={(e) => setAction(i, { payload: e.target.value })}
                              placeholder='{"command":"power_on"}'
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono"
                            />
                          </Field>
                        </div>
                      </>
                    )}

                    {a.type === 'notification' && (
                      <Field label="Message" error={errors[`action_${i}_message`]}>
                        <input
                          value={a.message ?? ''}
                          onChange={(e) => setAction(i, { message: e.target.value })}
                          placeholder="High temp on {thing.name}: {value}°C"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">
                          Placeholders: <code>{'{thing.name}'}</code>, <code>{'{value}'}</code>, <code>{'{metric}'}</code>
                        </p>
                      </Field>
                    )}

                    {a.type === 'update_status' && (
                      <>
                        <Field label="Target Thing">
                          <ThingPicker
                            orgId={orgId}
                            value={a.targetThingId}
                            onChange={(id) => setAction(i, { targetThingId: id })}
                          />
                        </Field>
                        <Field label="New Status">
                          <select
                            value={a.newStatus ?? 'active'}
                            onChange={(e) => setAction(i, { newStatus: e.target.value as any })}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
                          >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="retired">Retired</option>
                          </select>
                        </Field>
                      </>
                    )}

                    {a.type === 'update_metadata' && (
                      <>
                        <Field label="Target Thing">
                          <ThingPicker
                            orgId={orgId}
                            value={a.targetThingId}
                            onChange={(id) => setAction(i, { targetThingId: id })}
                          />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Key">
                            <input
                              value={a.metadataKey ?? ''}
                              onChange={(e) => setAction(i, { metadataKey: e.target.value })}
                              placeholder="description"
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            />
                          </Field>
                          <Field label="Value">
                            <input
                              value={a.metadataValue ?? ''}
                              onChange={(e) => setAction(i, { metadataValue: e.target.value })}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            />
                          </Field>
                        </div>
                      </>
                    )}

                    {a.type === 'webhook' && (
                      <Field label="Webhook URL" error={errors[`action_${i}_url`]}>
                        <input
                          value={a.webhookUrl ?? ''}
                          onChange={(e) => setAction(i, { webhookUrl: e.target.value })}
                          placeholder="https://example.com/hook"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                      </Field>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addAction}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  <Plus size={12} /> Add another action
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Settings</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Cooldown (minutes)">
                    <input
                      type="number"
                      min={0}
                      value={form.cooldownMinutes ?? 0}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, cooldownMinutes: Number(e.target.value) }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </Field>
                  <Field label="Max Triggers (blank = unlimited)">
                    <input
                      type="number"
                      min={0}
                      value={form.maxTriggers ?? ''}
                      onChange={(e) => {
                        const v = e.target.value
                        setForm((f) => ({
                          ...f,
                          maxTriggers: v === '' ? null : Number(v),
                        }))
                      }}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </Field>
                </div>
                <Field label="Schedule">
                  <select
                    value={form.schedule}
                    onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value as RuleSchedule }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
                  >
                    <option value="always">Always active</option>
                    <option value="business_hours">Business hours (Mon-Fri 9-17)</option>
                    <option value="weekdays">Weekdays only</option>
                    <option value="custom">Custom cron</option>
                  </select>
                </Field>
                <Field label="Enabled">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.enabled ?? true}
                      onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                      className="rounded"
                    />
                    <span>Rule is active</span>
                  </label>
                </Field>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prev}
          disabled={step === 0 && mode === 'edit'}
          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-30"
        >
          <ChevronLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-2">
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleSave(false)}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
              >
                <Save size={12} /> {mode === 'edit' ? 'Save Changes' : 'Save Rule'}
              </button>
              {mode === 'create' && (
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
                >
                  <Play size={12} /> Save & Test
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
    </div>
  )
}
