import { createFileRoute } from '@tanstack/react-router'
import AssetDetailPage from '#/features/list/pages/AssetDetailPage'

export const Route = createFileRoute('/_auth/list_/$assetId')({
  component: AssetDetailPage,
})
