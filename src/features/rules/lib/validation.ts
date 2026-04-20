import type { CreateRuleInput } from '#/lib/rulesEngine'

export function validateRule(rule: Partial<CreateRuleInput>): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!rule.name || rule.name.trim().length < 2) {
    errors.name = 'Name is required (min 2 chars)'
  }

  const t = rule.trigger
  if (!t) {
    errors.trigger = 'Trigger is required'
  } else {
    if (t.type === 'specific_thing' && !t.thingId) {
      errors.triggerThing = 'Pick a source Thing'
    }
    if (!t.metric) {
      errors.metric = 'Metric is required'
    }
    if (t.threshold === undefined || t.threshold === '') {
      errors.threshold = 'Threshold is required'
    }
  }

  if (!rule.actions || rule.actions.length === 0) {
    errors.actions = 'At least one action is required'
  } else {
    rule.actions.forEach((a, i) => {
      if (a.type === 'send_command' && !a.targetThingId) {
        errors[`action_${i}_target`] = 'Target Thing is required'
      }
      if (a.type === 'notification' && (!a.message || a.message.trim() === '')) {
        errors[`action_${i}_message`] = 'Message is required'
      }
      if (a.type === 'webhook' && !a.webhookUrl) {
        errors[`action_${i}_url`] = 'Webhook URL is required'
      }
    })
  }

  return errors
}
