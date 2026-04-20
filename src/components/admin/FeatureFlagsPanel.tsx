import { useState } from 'react'
import { Settings2, RotateCcw, Save, Shield } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Switch } from '#/components/ui/switch'
import {
  FEATURES,
  FEATURE_FLAG_KEYS,
  clearOverrides,
  getDefaults,
  setOverrides,
  type FeatureFlag,
  type FeatureFlagsState,
} from '#/lib/feature-flags'

type Meta = { session: string; label: string; description: string }

const FLAG_META: Record<FeatureFlag, Meta> = {
  SETTINGS_PAGE: {
    session: 'E',
    label: 'Settings page',
    description: 'Organization settings, profile, export/import tools.',
  },
  CONSUMER_WARRANTY: {
    session: 'F',
    label: 'Consumer warranty',
    description: 'Public activation flow, auto-activation, certificate page.',
  },
  CLOUD_CONNECTOR: {
    session: 'G',
    label: 'Cloud connector',
    description: 'Cloud connections, resolver, device messenger.',
  },
  RULES_ENGINE: {
    session: 'H',
    label: 'Rules engine',
    description: 'Automation rules, simulator, notifications feed.',
  },
  AUTO_DISCOVERY: {
    session: 'I',
    label: 'Auto-discovery',
    description: 'Device discovery dashboard and topology.',
  },
  DEVICE_IDENTITY: {
    session: 'J',
    label: 'Device identity',
    description: 'Device DID, wallet, capabilities.',
  },
  MACHINE_ECONOMY: {
    session: 'K',
    label: 'Machine economy',
    description: 'Marketplace, negotiations, contracts.',
  },
  WARRANTY_MANAGEMENT: {
    session: 'patch',
    label: 'Warranty management',
    description: 'Edit warranty on thing detail + extended dashboard widgets.',
  },
  FULL_MEGA_MENU: {
    session: 'patch',
    label: 'Full mega menu',
    description: 'Show the full GoDaddy-style mega menu on the public navbar.',
  },
}

const PRESETS: Record<string, Partial<FeatureFlagsState>> = {
  'Core Only': Object.fromEntries(
    FEATURE_FLAG_KEYS.map((k) => [k, k === 'FULL_MEGA_MENU']),
  ) as FeatureFlagsState,
  'Core + Warranty': Object.fromEntries(
    FEATURE_FLAG_KEYS.map((k) => [
      k,
      k === 'FULL_MEGA_MENU' || k === 'CONSUMER_WARRANTY' || k === 'WARRANTY_MANAGEMENT',
    ]),
  ) as FeatureFlagsState,
  'All On': Object.fromEntries(
    FEATURE_FLAG_KEYS.map((k) => [k, true]),
  ) as FeatureFlagsState,
}

export default function FeatureFlagsPanel() {
  // Start from the currently-resolved FEATURES snapshot (overrides + env + defaults).
  const [draft, setDraft] = useState<FeatureFlagsState>({ ...FEATURES })
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const toggle = (key: FeatureFlag) => {
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const applyPreset = (name: keyof typeof PRESETS) => {
    setDraft({ ...(PRESETS[name] as FeatureFlagsState) })
  }

  const applyAndReload = () => {
    setOverrides(draft)
    setSavedAt(new Date().toISOString())
    window.location.reload()
  }

  const resetToDefaults = () => {
    clearOverrides()
    setDraft(getDefaults())
    window.location.reload()
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Settings2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Feature Flags
          </h1>
          <p className="text-sm text-gray-500">
            Toggle advanced features on/off. Changes are saved to localStorage
            and applied on reload.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Core (always on)
          </h2>
        </div>
        <ul className="space-y-1.5 text-sm text-gray-700">
          <li>✓ Landing page (Session A)</li>
          <li>✓ Public search (Session B)</li>
          <li>✓ Register Thing (Session C)</li>
          <li>✓ Public warranty page (Session D)</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 mb-6">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
          Advanced (toggleable)
        </h2>
        <div className="divide-y divide-gray-100">
          {FEATURE_FLAG_KEYS.map((key) => {
            const meta = FLAG_META[key]
            return (
              <div
                key={key}
                className="flex items-start justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 rounded px-1.5 py-0.5">
                      {meta.session}
                    </span>
                    <p className="text-sm font-semibold text-gray-900">
                      {meta.label}
                    </p>
                    <code className="text-[10px] font-mono text-gray-400">
                      {key}
                    </code>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {meta.description}
                  </p>
                </div>
                <Switch
                  checked={draft[key]}
                  onCheckedChange={() => toggle(key)}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 mb-6">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
          Quick presets
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((name) => (
            <Button
              key={name}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(name)}
            >
              {name}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={applyAndReload} className="gap-2">
          <Save className="w-4 h-4" />
          Apply &amp; Reload
        </Button>
        <Button variant="outline" onClick={resetToDefaults} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Reset to defaults
        </Button>
        {savedAt && (
          <span className="text-xs text-emerald-600 self-center">
            Saved {new Date(savedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      <p className="text-[11px] text-gray-400 mt-6">
        Tip: press <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 font-mono">Ctrl</kbd>
        {' + '}
        <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 font-mono">Shift</kbd>
        {' + '}
        <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 font-mono">F</kbd>
        {' '}anywhere in the authenticated app to reopen this panel.
      </p>
    </div>
  )
}
