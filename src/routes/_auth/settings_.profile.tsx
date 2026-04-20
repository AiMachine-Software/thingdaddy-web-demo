import { createFileRoute, redirect } from '@tanstack/react-router'
import ProfileSettingsPage from '#/features/settings/pages/ProfileSettingsPage'
import { isEnabled } from '#/lib/feature-flags'

export const Route = createFileRoute('/_auth/settings_/profile')({
  beforeLoad: () => {
    if (!isEnabled('SETTINGS_PAGE')) throw redirect({ to: '/dashboard' })
  },
  component: ProfileSettingsPage,
})
