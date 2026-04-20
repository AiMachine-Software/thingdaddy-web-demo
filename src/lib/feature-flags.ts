/**
 * Feature Flags Configuration
 *
 * Single source of truth for toggling advanced features on/off.
 * Sessions A–D (landing, public search, register, public warranty) are always on.
 * Sessions E–K are toggleable below.
 *
 * Resolution priority (highest first):
 *   1. localStorage['feature_flags_override']  (admin panel, Ctrl+Shift+F)
 *   2. import.meta.env.VITE_FEATURE_*          (.env / .env.local)
 *   3. Hardcoded defaults in this file
 */

// ── Defaults ──────────────────────────────────────────
const DEFAULTS = {
  // Session E: Organization + profile settings page
  SETTINGS_PAGE: true,

  // Session F: Consumer warranty activation + auto-activation + certificate
  CONSUMER_WARRANTY: false,

  // Session G: Cloud connections + resolver + messenger
  CLOUD_CONNECTOR: false,

  // Session H: Rules engine + automation + simulator
  RULES_ENGINE: false,

  // Session I: Device auto-discovery + topology
  AUTO_DISCOVERY: false,

  // Session J: Device identity (DID) + wallet + capabilities
  DEVICE_IDENTITY: false,

  // Session K: Marketplace + negotiation + contracts
  MACHINE_ECONOMY: false,

  // Patch: Warranty management (edit warranty on thing detail + dashboard widgets)
  WARRANTY_MANAGEMENT: false,

  // Patch: Full GoDaddy mega menu (all items vs minimal)
  FULL_MEGA_MENU: true,
} as const

export type FeatureFlag = keyof typeof DEFAULTS
export type FeatureFlagsState = Record<FeatureFlag, boolean>

const LS_KEY = 'feature_flags_override'

function readEnv(key: FeatureFlag): boolean | undefined {
  // import.meta.env is populated by Vite at build time
  const envKey = `VITE_FEATURE_${key}`
  try {
    const value = (import.meta as any)?.env?.[envKey]
    if (value === undefined || value === null || value === '') return undefined
    if (typeof value === 'boolean') return value
    const normalized = String(value).trim().toLowerCase()
    if (normalized === 'true' || normalized === '1') return true
    if (normalized === 'false' || normalized === '0') return false
    return undefined
  } catch {
    return undefined
  }
}

function readOverrides(): Partial<FeatureFlagsState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return parsed as Partial<FeatureFlagsState>
    }
    return {}
  } catch {
    return {}
  }
}

function resolveFlag(key: FeatureFlag): boolean {
  const overrides = readOverrides()
  if (key in overrides && typeof overrides[key] === 'boolean') {
    return overrides[key] as boolean
  }
  const envVal = readEnv(key)
  if (envVal !== undefined) return envVal
  return DEFAULTS[key]
}

function buildSnapshot(): FeatureFlagsState {
  const out = {} as FeatureFlagsState
  for (const key of Object.keys(DEFAULTS) as FeatureFlag[]) {
    out[key] = resolveFlag(key)
  }
  return out
}

/**
 * FEATURES is a live snapshot resolved at module load. For most call sites
 * (sidebar, route guards, widgets) this is fine — flags only change via the
 * admin panel which triggers a full page reload.
 */
export const FEATURES: FeatureFlagsState = buildSnapshot()

export function isEnabled(flag: FeatureFlag): boolean {
  return FEATURES[flag]
}

/** Returns the current overrides saved in localStorage (if any). */
export function getOverrides(): Partial<FeatureFlagsState> {
  return readOverrides()
}

/** Returns the defaults as defined in this file. */
export function getDefaults(): FeatureFlagsState {
  return { ...DEFAULTS } as FeatureFlagsState
}

/** Write a full or partial override map to localStorage. Caller should reload. */
export function setOverrides(next: Partial<FeatureFlagsState>): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}

/** Clear all overrides — falls back to env / defaults. */
export function clearOverrides(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(LS_KEY)
  } catch {
    /* ignore */
  }
}

export const FEATURE_FLAG_KEYS = Object.keys(DEFAULTS) as FeatureFlag[]
