import { createFileRoute, redirect } from '@tanstack/react-router'
import ContractsPage from '#/features/economy/pages/ContractsPage'
import { isEnabled } from '#/lib/feature-flags'

export const Route = createFileRoute('/_auth/economy_/contracts')({
  beforeLoad: () => {
    if (!isEnabled('MACHINE_ECONOMY')) throw redirect({ to: '/dashboard' })
  },
  component: ContractsPage,
})
