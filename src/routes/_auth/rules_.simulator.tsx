import { createFileRoute, redirect } from '@tanstack/react-router'
import SimulatorPage from '#/features/rules/pages/SimulatorPage'
import { isEnabled } from '#/lib/feature-flags'

export const Route = createFileRoute('/_auth/rules_/simulator')({
  beforeLoad: () => {
    if (!isEnabled('RULES_ENGINE')) throw redirect({ to: '/dashboard' })
  },
  component: SimulatorPage,
})
