import { createFileRoute, redirect } from '@tanstack/react-router'
import EconomyDashboardPage from '#/features/economy/pages/EconomyDashboardPage'
import { isEnabled } from '#/lib/feature-flags'

export const Route = createFileRoute('/_auth/economy')({
  beforeLoad: () => {
    if (!isEnabled('MACHINE_ECONOMY')) throw redirect({ to: '/dashboard' })
  },
  component: EconomyDashboardPage,
})
