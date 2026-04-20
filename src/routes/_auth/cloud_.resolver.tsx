import { createFileRoute, redirect } from '@tanstack/react-router'
import CloudResolverPage from '#/features/cloud/pages/CloudResolverPage'
import { isEnabled } from '#/lib/feature-flags'

export const Route = createFileRoute('/_auth/cloud_/resolver')({
  beforeLoad: () => {
    if (!isEnabled('CLOUD_CONNECTOR')) throw redirect({ to: '/dashboard' })
  },
  component: CloudResolverPage,
})
