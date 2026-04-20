import { mockDb } from './mockDb'
import { getDidFor, ensureIdentitiesForOrg } from './deviceIdentity'

// ─── Types ───────────────────────────────────────────────

export type WalletTransactionType =
  | 'data_purchase'
  | 'service_payment'
  | 'compute_job'
  | 'energy_trade'
  | 'resolution_fee'
  | 'warranty_fee'
  | 'top_up'
  | 'transfer'

export type WalletTransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export interface DeviceWallet {
  thingId: string
  did: string
  balance: number
  pendingIncoming: number
  reservedOutgoing: number
  totalEarned: number
  totalSpent: number
  createdAt: string
}

export interface WalletTransaction {
  id: string
  fromThingId: string
  fromDid: string
  toThingId: string
  toDid: string
  amount: number
  currency: 'TC'
  type: WalletTransactionType
  description: string
  status: WalletTransactionStatus
  negotiationId?: string
  contractId?: string
  createdAt: string
  completedAt?: string
}

// ─── Storage ─────────────────────────────────────────────

const WALLETS_KEY = 'thingdaddy.economy.wallets.v1'
const TX_KEY = 'thingdaddy.economy.transactions.v1'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function loadJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function saveJson<T>(key: string, value: T): void {
  if (!isBrowser()) return
  localStorage.setItem(key, JSON.stringify(value))
}

function loadWallets(): Record<string, DeviceWallet> {
  return loadJson<Record<string, DeviceWallet>>(WALLETS_KEY, {})
}

function saveWallets(w: Record<string, DeviceWallet>): void {
  saveJson(WALLETS_KEY, w)
}

function loadTransactions(): WalletTransaction[] {
  return loadJson<WalletTransaction[]>(TX_KEY, [])
}

function saveTransactions(tx: WalletTransaction[]): void {
  saveJson(TX_KEY, tx)
}

function newId(prefix: string): string {
  return isBrowser() && typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `${prefix}_${crypto.randomUUID().slice(0, 12)}`
    : `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// ─── API ─────────────────────────────────────────────────

export function getWallet(thingId: string): DeviceWallet | undefined {
  return loadWallets()[thingId]
}

export function ensureWallet(thingId: string, initialBalance = 0): DeviceWallet {
  const wallets = loadWallets()
  if (wallets[thingId]) return wallets[thingId]
  const wallet: DeviceWallet = {
    thingId,
    did: getDidFor(thingId),
    balance: initialBalance,
    pendingIncoming: 0,
    reservedOutgoing: 0,
    totalEarned: 0,
    totalSpent: 0,
    createdAt: new Date().toISOString(),
  }
  wallets[thingId] = wallet
  saveWallets(wallets)
  return wallet
}

export function setWallet(wallet: DeviceWallet): void {
  const wallets = loadWallets()
  wallets[wallet.thingId] = wallet
  saveWallets(wallets)
}

export function ensureWalletsForOrg(orgId: string, initialBalance: (idx: number) => number): void {
  ensureIdentitiesForOrg(orgId)
  const assets = mockDb.getAssets(orgId)
  const wallets = loadWallets()
  let changed = false
  assets.forEach((asset, idx) => {
    if (!wallets[asset.id]) {
      wallets[asset.id] = {
        thingId: asset.id,
        did: getDidFor(asset.id),
        balance: initialBalance(idx),
        pendingIncoming: 0,
        reservedOutgoing: 0,
        totalEarned: 0,
        totalSpent: 0,
        createdAt: asset.createdAt ?? new Date().toISOString(),
      }
      changed = true
    }
  })
  if (changed) saveWallets(wallets)
}

export function listTransactions(thingId?: string, limit?: number): WalletTransaction[] {
  const all = loadTransactions()
  const filtered = thingId
    ? all.filter((t) => t.fromThingId === thingId || t.toThingId === thingId)
    : all
  const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return limit ? sorted.slice(0, limit) : sorted
}

export function listTransactionsForOrg(orgId: string, limit?: number): WalletTransaction[] {
  const thingIds = new Set(mockDb.getAssets(orgId).map((a) => a.id))
  const all = loadTransactions()
  const filtered = all.filter(
    (t) => thingIds.has(t.fromThingId) || thingIds.has(t.toThingId),
  )
  const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return limit ? sorted.slice(0, limit) : sorted
}

export interface TransferInput {
  fromThingId: string
  toThingId: string
  amount: number
  type: WalletTransactionType
  description: string
  negotiationId?: string
  contractId?: string
  /** Skip balance check — used for demo top-ups. */
  force?: boolean
  createdAt?: string
}

export function transfer(input: TransferInput): WalletTransaction {
  const wallets = loadWallets()
  const from = wallets[input.fromThingId] ?? ensureWallet(input.fromThingId, 0)
  const to = wallets[input.toThingId] ?? ensureWallet(input.toThingId, 0)

  const refresh = loadWallets()
  const fromW = refresh[from.thingId]
  const toW = refresh[to.thingId]

  if (!input.force && fromW.balance < input.amount) {
    const failed: WalletTransaction = {
      id: newId('tx'),
      fromThingId: fromW.thingId,
      fromDid: fromW.did,
      toThingId: toW.thingId,
      toDid: toW.did,
      amount: input.amount,
      currency: 'TC',
      type: input.type,
      description: input.description,
      status: 'failed',
      negotiationId: input.negotiationId,
      contractId: input.contractId,
      createdAt: input.createdAt ?? new Date().toISOString(),
    }
    const all = loadTransactions()
    saveTransactions([failed, ...all])
    return failed
  }

  fromW.balance = Math.round((fromW.balance - input.amount) * 100) / 100
  fromW.totalSpent = Math.round((fromW.totalSpent + input.amount) * 100) / 100
  toW.balance = Math.round((toW.balance + input.amount) * 100) / 100
  toW.totalEarned = Math.round((toW.totalEarned + input.amount) * 100) / 100
  refresh[fromW.thingId] = fromW
  refresh[toW.thingId] = toW
  saveWallets(refresh)

  const now = input.createdAt ?? new Date().toISOString()
  const tx: WalletTransaction = {
    id: newId('tx'),
    fromThingId: fromW.thingId,
    fromDid: fromW.did,
    toThingId: toW.thingId,
    toDid: toW.did,
    amount: input.amount,
    currency: 'TC',
    type: input.type,
    description: input.description,
    status: 'completed',
    negotiationId: input.negotiationId,
    contractId: input.contractId,
    createdAt: now,
    completedAt: now,
  }
  const all = loadTransactions()
  saveTransactions([tx, ...all])
  return tx
}

export function topUp(thingId: string, amount: number): WalletTransaction {
  const wallets = loadWallets()
  const wallet = wallets[thingId] ?? ensureWallet(thingId, 0)
  wallet.balance = Math.round((wallet.balance + amount) * 100) / 100
  wallets[thingId] = wallet
  saveWallets(wallets)
  const now = new Date().toISOString()
  const tx: WalletTransaction = {
    id: newId('tx'),
    fromThingId: 'thingdaddy:treasury',
    fromDid: 'did:thingdaddy:treasury',
    toThingId: thingId,
    toDid: wallet.did,
    amount,
    currency: 'TC',
    type: 'top_up',
    description: 'Demo top-up from ThingDaddy treasury',
    status: 'completed',
    createdAt: now,
    completedAt: now,
  }
  saveTransactions([tx, ...loadTransactions()])
  return tx
}

export interface OrgWalletTotals {
  total: number
  earnedToday: number
  spentToday: number
  topEarners: Array<{ thingId: string; earnedToday: number; balance: number }>
  topSpenders: Array<{ thingId: string; spentToday: number; balance: number }>
}

export function getTotalsForOrg(orgId: string): OrgWalletTotals {
  const assets = mockDb.getAssets(orgId)
  const thingIds = new Set(assets.map((a) => a.id))
  const wallets = loadWallets()
  const txs = loadTransactions()
  const today = new Date().toISOString().slice(0, 10)

  let total = 0
  const earnedTodayByThing: Record<string, number> = {}
  const spentTodayByThing: Record<string, number> = {}

  for (const id of thingIds) {
    const w = wallets[id]
    if (w) total += w.balance
    earnedTodayByThing[id] = 0
    spentTodayByThing[id] = 0
  }

  for (const tx of txs) {
    if (tx.status !== 'completed') continue
    const txDay = tx.createdAt.slice(0, 10)
    if (txDay !== today) continue
    if (thingIds.has(tx.toThingId)) {
      earnedTodayByThing[tx.toThingId] = (earnedTodayByThing[tx.toThingId] ?? 0) + tx.amount
    }
    if (thingIds.has(tx.fromThingId)) {
      spentTodayByThing[tx.fromThingId] = (spentTodayByThing[tx.fromThingId] ?? 0) + tx.amount
    }
  }

  const earnedToday = Object.values(earnedTodayByThing).reduce((a, b) => a + b, 0)
  const spentToday = Object.values(spentTodayByThing).reduce((a, b) => a + b, 0)

  const topEarners = Object.entries(earnedTodayByThing)
    .map(([thingId, earnedTodayVal]) => ({
      thingId,
      earnedToday: earnedTodayVal,
      balance: wallets[thingId]?.balance ?? 0,
    }))
    .sort((a, b) => b.earnedToday - a.earnedToday)
    .slice(0, 5)

  const topSpenders = Object.entries(spentTodayByThing)
    .map(([thingId, spentTodayVal]) => ({
      thingId,
      spentToday: spentTodayVal,
      balance: wallets[thingId]?.balance ?? 0,
    }))
    .sort((a, b) => b.spentToday - a.spentToday)
    .slice(0, 5)

  return { total: Math.round(total * 100) / 100, earnedToday, spentToday, topEarners, topSpenders }
}
