import { createFileRoute, redirect } from '@tanstack/react-router'
import MarketplacePage from '#/features/economy/pages/MarketplacePage'
import { isEnabled } from '#/lib/feature-flags'

export const Route = createFileRoute('/_auth/economy_/marketplace')({
  beforeLoad: () => {
    if (!isEnabled('MACHINE_ECONOMY')) throw redirect({ to: '/dashboard' })
  },
  component: MarketplacePage,
})
