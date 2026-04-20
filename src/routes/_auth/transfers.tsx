import { createFileRoute } from '@tanstack/react-router'
import TransfersPage from '#/features/transfers/pages/TransfersPage'

export const Route = createFileRoute('/_auth/transfers')({
  component: TransfersPage,
})
