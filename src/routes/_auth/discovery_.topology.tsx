import { createFileRoute, redirect } from '@tanstack/react-router'
import TopologyPage from '#/features/discovery/pages/TopologyPage'
import { isEnabled } from '#/lib/feature-flags'

export const Route = createFileRoute('/_auth/discovery_/topology')({
  beforeLoad: () => {
    if (!isEnabled('AUTO_DISCOVERY')) throw redirect({ to: '/dashboard' })
  },
  component: TopologyPage,
})
