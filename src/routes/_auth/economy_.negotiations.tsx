import { createFileRoute, redirect } from '@tanstack/react-router'
import NegotiationsPage from '#/features/economy/pages/NegotiationsPage'
import { isEnabled } from '#/lib/feature-flags'

export const Route = createFileRoute('/_auth/economy_/negotiations')({
  beforeLoad: () => {
    if (!isEnabled('MACHINE_ECONOMY')) throw redirect({ to: '/dashboard' })
  },
  component: NegotiationsPage,
})
