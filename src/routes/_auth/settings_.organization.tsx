import { createFileRoute, redirect } from '@tanstack/react-router'
import OrganizationSettingsPage from '#/features/settings/pages/OrganizationSettingsPage'
import { isEnabled } from '#/lib/feature-flags'

export const Route = createFileRoute('/_auth/settings_/organization')({
  beforeLoad: () => {
    if (!isEnabled('SETTINGS_PAGE')) throw redirect({ to: '/dashboard' })
  },
  component: OrganizationSettingsPage,
})
