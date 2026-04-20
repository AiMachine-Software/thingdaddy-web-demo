import { createFileRoute, redirect } from '@tanstack/react-router'
import DeviceMessengerPage from '#/features/cloud/pages/DeviceMessengerPage'
import { isEnabled } from '#/lib/feature-flags'

export const Route = createFileRoute('/_auth/cloud_/messenger')({
  beforeLoad: () => {
    if (!isEnabled('CLOUD_CONNECTOR')) throw redirect({ to: '/dashboard' })
  },
  component: DeviceMessengerPage,
})
