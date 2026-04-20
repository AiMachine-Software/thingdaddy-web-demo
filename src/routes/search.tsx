import SearchPage from '#/features/search/pages/SearchPage'
import { createFileRoute } from '@tanstack/react-router'

interface SearchParams {
  q?: string
}

export const Route = createFileRoute('/search')({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: typeof s.q === 'string' ? s.q : undefined,
  }),
  component: SearchPage,
})
