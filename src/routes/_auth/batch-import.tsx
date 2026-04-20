import { createFileRoute } from '@tanstack/react-router'
import BatchImportPage from '#/features/batch/pages/BatchImportPage'

export const Route = createFileRoute('/_auth/batch-import')({
  component: BatchImportPage,
})
