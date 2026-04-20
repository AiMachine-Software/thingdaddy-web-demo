import LoginPage from '#/features/login/pages/LoginPage'
import { createFileRoute } from '@tanstack/react-router'

interface LoginSearch {
  redirect?: string
  thingType?: string
}

export const Route = createFileRoute('/login')({
  validateSearch: (s: Record<string, unknown>): LoginSearch => ({
    redirect: typeof s.redirect === 'string' ? s.redirect : undefined,
    thingType: typeof s.thingType === 'string' ? s.thingType : undefined,
  }),
  component: LoginPage,
})
