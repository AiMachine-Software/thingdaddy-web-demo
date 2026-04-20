import { createFileRoute, redirect } from '@tanstack/react-router'
import RuleDetailPage from '#/features/rules/pages/RuleDetailPage'
import { isEnabled } from '#/lib/feature-flags'

export const Route = createFileRoute('/_auth/rules_/$ruleId')({
  beforeLoad: () => {
    if (!isEnabled('RULES_ENGINE')) throw redirect({ to: '/dashboard' })
  },
  component: RuleDetailPage,
})
