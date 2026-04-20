import { createFileRoute, redirect } from '@tanstack/react-router'
import DiscoveryDashboardPage from '#/features/discovery/pages/DiscoveryDashboardPage'
import { isEnabled } from '#/lib/feature-flags'

export const Route = createFileRoute('/_auth/discovery')({
  beforeLoad: () => {
    if (!isEnabled('AUTO_DISCOVERY')) throw redirect({ to: '/dashboard' })
  },
  component: DiscoveryDashboardPage,
})
