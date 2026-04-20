// ─── Types ───────────────────────────────────────────────

export interface ThingRating {
  id: string
  contractId: string
  raterThingId: string
  ratedThingId: string
  rating: number // 1-5
  metrics: {
    reliability: number
    quality: number
    responseTime: number
  }
  comment?: string
  createdAt: string
}

// ─── Storage ─────────────────────────────────────────────

const STORAGE_KEY = 'thingdaddy.economy.ratings.v1'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function loadAll(): ThingRating[] {
  if (!isBrowser()) return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as ThingRating[]
  } catch {
    return []
  }
}

function saveAll(list: ThingRating[]): void {
  if (!isBrowser()) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function newId(): string {
  if (isBrowser() && typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `rat_${crypto.randomUUID().slice(0, 12)}`
  }
  return `rat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

// ─── API ─────────────────────────────────────────────────

export interface CreateRatingInput {
  contractId: string
  raterThingId: string
  ratedThingId: string
  rating: number
  metrics?: Partial<ThingRating['metrics']>
  comment?: string
}

export function createRating(input: CreateRatingInput): ThingRating {
  const rating: ThingRating = {
    id: newId(),
    contractId: input.contractId,
    raterThingId: input.raterThingId,
    ratedThingId: input.ratedThingId,
    rating: input.rating,
    metrics: {
      reliability: input.metrics?.reliability ?? input.rating,
      quality: input.metrics?.quality ?? input.rating,
      responseTime: input.metrics?.responseTime ?? input.rating,
    },
    comment: input.comment,
    createdAt: new Date().toISOString(),
  }
  saveAll([rating, ...loadAll()])
  return rating
}

export function listRatings(): ThingRating[] {
  return loadAll()
}

export function ratingsForThing(thingId: string): ThingRating[] {
  return loadAll().filter((r) => r.ratedThingId === thingId)
}

export interface RatingAggregate {
  avg: number
  count: number
}

export function averageRating(thingId: string): RatingAggregate {
  const list = ratingsForThing(thingId)
  if (list.length === 0) return { avg: 0, count: 0 }
  const total = list.reduce((sum, r) => sum + r.rating, 0)
  return { avg: Math.round((total / list.length) * 10) / 10, count: list.length }
}
