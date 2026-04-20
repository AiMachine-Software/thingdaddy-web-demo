import { createFileRoute } from '@tanstack/react-router'
import FeatureFlagsPanel from '#/components/admin/FeatureFlagsPanel'

export const Route = createFileRoute('/_auth/admin_/features')({
  component: FeatureFlagsPanel,
})
