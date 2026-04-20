import { createFileRoute } from '@tanstack/react-router'
import CreatePage from '#/features/create/pages/CreatePage'

interface CreateSearch {
  thingType?: string
}

export const Route = createFileRoute('/_auth/create')({
  validateSearch: (s: Record<string, unknown>): CreateSearch => ({
    thingType: typeof s.thingType === 'string' ? s.thingType : undefined,
  }),
  component: CreatePage,
})
