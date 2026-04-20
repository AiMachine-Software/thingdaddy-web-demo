import { createFileRoute, redirect } from '@tanstack/react-router'
import RuleBuilderPage from '#/features/rules/pages/RuleBuilderPage'
import { isEnabled } from '#/lib/feature-flags'

export const Route = createFileRoute('/_auth/rules_/create')({
  beforeLoad: () => {
    if (!isEnabled('RULES_ENGINE')) throw redirect({ to: '/dashboard' })
  },
  component: () => <RuleBuilderPage mode="create" />,
})
