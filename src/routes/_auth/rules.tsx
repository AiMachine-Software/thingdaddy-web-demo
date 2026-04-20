import { createFileRoute, redirect } from '@tanstack/react-router'
import RulesListPage from '#/features/rules/pages/RulesListPage'
import { isEnabled } from '#/lib/feature-flags'

export const Route = createFileRoute('/_auth/rules')({
  beforeLoad: () => {
    if (!isEnabled('RULES_ENGINE')) throw redirect({ to: '/dashboard' })
  },
  component: RulesListPage,
})
