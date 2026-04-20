import { auth } from './auth'

export function getCurrentOrgId(): string | null {
  const user = auth.getCurrentUser()
  return user?.orgId ?? null
}

export function requireOrgId(): string {
  const orgId = getCurrentOrgId()
  if (!orgId) throw new Error('Not authenticated')
  return orgId
}
