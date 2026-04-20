import SearchAssetPage from '#/features/search/pages/SearchAssetPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/search-assets')({
  component: SearchAssetPage,
})
