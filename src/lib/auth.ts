import { mockDb } from './mockDb'

export interface User {
  id: string
  name: string
  email: string
  password?: string
  orgId: string
  role: 'admin' | 'member'
  createdAt: string
}

const USERS_KEY = 'mock_users'
const CURRENT_USER_KEY = 'mock_current_user'

// Stable org IDs matching mockDb seed
const SEED_ORG_IDS = {
  thingdaddy: 'org_00000005-0000-0000-0000-000000000005',
  cpgroup: 'org_00000002-0000-0000-0000-000000000002',
  milesight: 'org_00000006-0000-0000-0000-000000000006',
}

const SEED_USERS: User[] = [
  {
    id: 'user-001',
    name: 'Admin User',
    email: 'admin@thingdaddy.dev',
    password: 'password',
    orgId: SEED_ORG_IDS.thingdaddy,
    role: 'admin',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-002',
    name: 'Somchai Demo',
    email: 'somchai@cp.co.th',
    password: 'password',
    orgId: SEED_ORG_IDS.cpgroup,
    role: 'admin',
    createdAt: '2025-02-01T00:00:00Z',
  },
  {
    id: 'user-003',
    name: 'Li Wei',
    email: 'liwei@milesight.com',
    password: 'password',
    orgId: SEED_ORG_IDS.milesight,
    role: 'admin',
    createdAt: '2025-03-15T00:00:00Z',
  },
]

function seedUsers(): void {
  if (typeof window === 'undefined') return
  const stored = localStorage.getItem(USERS_KEY)
  if (!stored || stored === '[]') {
    localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS))
  }
}

function getUsers(): User[] {
  if (typeof window === 'undefined') return []
  seedUsers()
  const stored = localStorage.getItem(USERS_KEY)
  if (!stored) return []
  try { return JSON.parse(stored) } catch { return [] }
}

export const auth = {
  login: async (email: string, passwordAttempt: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const users = getUsers()
    const user = users.find((u) => u.email === email)

    if (!user) throw new Error('Invalid email or password.')
    if (user.password !== passwordAttempt) throw new Error('Invalid email or password.')

    const { password: _, ...safeUser } = user
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser))
    return safeUser
  },

  register: async (data: {
    name: string
    email: string
    password: string
    companyPrefix: string
    domain?: string
    subdomain?: string
    gs1Application?: import('#/features/register/types').GS1ApplicationData
  }) => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const users = getUsers()

    if (users.find((u) => u.email === data.email)) {
      throw new Error('Email address already registered.')
    }

    // Find or create organization from prefix
    let org = mockDb.getOrgByPrefix(data.companyPrefix)
    if (!org) {
      // Look up company name from prefix directory
      const { COMPANY_PREFIX_DIRECTORY } = await import('#/lib/gs1/company-prefixes')
      const entry = COMPANY_PREFIX_DIRECTORY.find((c) => c.prefix === data.companyPrefix)
      org = mockDb.createOrg({
        name: entry?.name || `Organization ${data.companyPrefix}`,
        nameLocal: entry?.nameLocal,
        companyPrefix: data.companyPrefix,
        country: entry?.country || 'US',
        domain: data.domain,
        subdomain: data.subdomain,
        gs1Application: data.gs1Application,
      })
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      password: data.password,
      orgId: org.id,
      role: 'admin',
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    localStorage.setItem(USERS_KEY, JSON.stringify(users))

    // Auto-login
    const { password: _, ...safeUser } = newUser
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser))

    return { user: safeUser, org }
  },

  logout: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    localStorage.removeItem(CURRENT_USER_KEY)
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null
    const userStr = localStorage.getItem(CURRENT_USER_KEY)
    if (!userStr) return null
    try { return JSON.parse(userStr) } catch { return null }
  },

  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem(CURRENT_USER_KEY)
  },

  updateCurrentUser: (updates: { name?: string; email?: string }): User => {
    const current = auth.getCurrentUser()
    if (!current) throw new Error('Not authenticated')
    const users = getUsers()
    const idx = users.findIndex((u) => u.id === current.id)
    if (idx === -1) throw new Error('User not found')
    if (updates.email && updates.email !== current.email) {
      if (users.some((u) => u.email === updates.email && u.id !== current.id)) {
        throw new Error('Email address already in use.')
      }
    }
    const next: User = { ...users[idx], ...updates }
    users[idx] = next
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    const { password: _, ...safeUser } = next
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser))
    return safeUser as User
  },

  changePassword: async (current: string, next: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const cur = auth.getCurrentUser()
    if (!cur) throw new Error('Not authenticated')
    const users = getUsers()
    const idx = users.findIndex((u) => u.id === cur.id)
    if (idx === -1) throw new Error('User not found')
    if (users[idx].password !== current) {
      throw new Error('Current password is incorrect.')
    }
    if (next.length < 6) throw new Error('New password must be at least 6 characters.')
    users[idx] = { ...users[idx], password: next }
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  },

  deleteAccount: async (): Promise<void> => {
    const cur = auth.getCurrentUser()
    if (!cur) throw new Error('Not authenticated')
    mockDb.deleteAssetsByOrg(cur.orgId)
    mockDb.deleteOrg(cur.orgId)
    const users = getUsers().filter((u) => u.id !== cur.id)
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    localStorage.removeItem(CURRENT_USER_KEY)
  },
}
