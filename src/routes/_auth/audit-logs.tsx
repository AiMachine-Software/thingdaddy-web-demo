import { createFileRoute } from '@tanstack/react-router'
import AuditLogPage from '#/features/audit/pages/AuditLogPage'

export const Route = createFileRoute('/_auth/audit-logs')({
  component: AuditLogPage,
})
