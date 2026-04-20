import HomePage from '#/features/home/pages/HomePage'
import { auth } from '#/lib/auth'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (typeof window !== 'undefined' && auth.isAuthenticated()) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: HomePage,
})
