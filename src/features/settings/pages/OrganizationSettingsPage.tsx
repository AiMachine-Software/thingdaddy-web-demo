import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Building2, Globe, Wrench, Users, ExternalLink, Shield, Radar, X } from 'lucide-react'
import {
  loadSettings as loadDiscoverySettings,
  saveSettings as saveDiscoverySettings,
  type DiscoverySettings,
} from '#/lib/discoveryEngine'
import {
  mockDb,
  type Organization,
  type OrgWarrantyDefaults,
  type WarrantyActivationMode,
} from '#/lib/mockDb'
import { auth } from '#/lib/auth'
import { getCurrentOrgId } from '#/lib/tenant'
import { Button } from '#/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '#/components/ui/tabs'
import Gs1ThailandForm from '#/features/register/components/Gs1ThailandForm'
import {
  EMPTY_GS1_APPLICATION,
  type GS1ApplicationData,
} from '#/features/register/types'
import {
  COMPANY_DEMO_GS1_APPLICATION,
  subdomainFromName,
} from '#/features/create/lib/demoData'
import SaveBar from '../components/SaveBar'
import { isEnabled } from '#/lib/feature-flags'

const inputCls =
  'block w-full rounded-lg border-0 py-2 px-3 text-sm shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 transition-all'

function logUpdate(orgId: string, changedFields: string[]) {
  const user = auth.getCurrentUser()
  mockDb.addAuditLog({
    action: 'updated',
    thingId: orgId,
    orgId,
    userId: user?.id,
    details: { changedFields },
  })
}

function useSavedFlash() {
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const flash = () => {
    const now = Date.now()
    setSavedAt(now)
    setTimeout(() => {
      setSavedAt((cur) => (cur === now ? null : cur))
    }, 2000)
  }
  return [savedAt, flash] as const
}

export default function OrganizationSettingsPage() {
  const orgId = getCurrentOrgId()
  const [org, setOrg] = useState<Organization | null>(null)
  const [orgName, setOrgName] = useState('')
  const [domain, setDomain] = useState('')
  const [gs1, setGs1] = useState<GS1ApplicationData>(EMPTY_GS1_APPLICATION)
  const [warrantyPeriod, setWarrantyPeriod] = useState<string>('24')
  const [warrantyMode, setWarrantyMode] = useState<WarrantyActivationMode>('owner_only')
  const [warrantyTerms, setWarrantyTerms] = useState('')
  const [discovery, setDiscovery] = useState<DiscoverySettings | null>(null)
  const [newMacBlock, setNewMacBlock] = useState('')

  useEffect(() => {
    if (!orgId) return
    const loaded = mockDb.getOrgById(orgId)
    if (!loaded) return
    setOrg(loaded)
    setOrgName(loaded.name)
    setDomain(loaded.domain ?? '')
    setGs1(loaded.gs1Application ?? EMPTY_GS1_APPLICATION)
    const wd = loaded.warrantyDefaults
    setWarrantyPeriod(wd?.periodMonths != null ? String(wd.periodMonths) : '')
    setWarrantyMode(wd?.activationMode ?? 'owner_only')
    setWarrantyTerms(wd?.terms ?? '')
    setDiscovery(loadDiscoverySettings(orgId))
  }, [orgId])

  const user = auth.getCurrentUser()

  const subdomain = useMemo(() => {
    const base = gs1.memberName || org?.name || ''
    return base ? `${subdomainFromName(base)}.thingdaddy.com` : ''
  }, [gs1.memberName, org?.name])

  const emailLocalPart = user?.email?.includes('@')
    ? user.email.split('@')[0]
    : user?.name?.toLowerCase().replace(/\s+/g, '.') ?? 'admin'
  const loginPreview = subdomain ? `${emailLocalPart}@${subdomain}` : ''

  const [generalSavedAt, flashGeneral] = useSavedFlash()
  const [gs1SavedAt, flashGs1] = useSavedFlash()
  const [domainSavedAt, flashDomain] = useSavedFlash()
  const [warrantySavedAt, flashWarranty] = useSavedFlash()
  const [discoverySavedAt, flashDiscovery] = useSavedFlash()

  const saveDiscovery = () => {
    if (!discovery) return
    saveDiscoverySettings(discovery)
    flashDiscovery()
  }
  const [appliedToExisting, setAppliedToExisting] = useState<number | null>(null)

  if (!orgId || !org) {
    return (
      <main className="p-8">
        <p className="text-sm text-gray-500">Loading organization…</p>
      </main>
    )
  }

  const sampleAssetId = mockDb.getAssets(orgId)[0]?.id

  const saveGeneral = () => {
    const updates: Partial<Organization> = {}
    const changed: string[] = []
    if (orgName !== org.name) {
      updates.name = orgName
      changed.push('name')
    }
    if (changed.length === 0) return flashGeneral()
    const next = mockDb.updateOrg(org.id, updates)
    if (next) {
      setOrg(next)
      logUpdate(org.id, changed)
      flashGeneral()
    }
  }

  const saveGs1 = () => {
    const next = { ...gs1, _lastUpdatedAt: new Date().toISOString() }
    const result = mockDb.updateOrg(org.id, { gs1Application: next })
    if (result) {
      setOrg(result)
      setGs1(next)
      logUpdate(org.id, ['gs1Application'])
      flashGs1()
    }
  }

  const saveDomain = () => {
    const updates: Partial<Organization> = {}
    const changed: string[] = []
    if ((org.domain ?? '') !== domain) {
      updates.domain = domain || undefined
      changed.push('domain')
    }
    if ((org.subdomain ?? '') !== subdomain) {
      updates.subdomain = subdomain || undefined
      changed.push('subdomain')
    }
    if (changed.length === 0) return flashDomain()
    const next = mockDb.updateOrg(org.id, updates)
    if (next) {
      setOrg(next)
      logUpdate(org.id, changed)
      flashDomain()
    }
  }

  const fillGs1Demo = () => {
    setGs1({ ...COMPANY_DEMO_GS1_APPLICATION })
  }

  const saveWarranty = () => {
    const periodMonths =
      warrantyPeriod === '' ? null : Number(warrantyPeriod)
    const defaults: OrgWarrantyDefaults = {
      periodMonths: Number.isFinite(periodMonths) ? (periodMonths as number | null) : null,
      activationMode: warrantyMode,
      terms: warrantyTerms || undefined,
    }
    const next = mockDb.updateOrg(org.id, { warrantyDefaults: defaults })
    if (next) {
      setOrg(next)
      logUpdate(org.id, ['warrantyDefaults'])
      flashWarranty()
    }
  }

  const applyDefaultsToExisting = () => {
    const periodMonths =
      warrantyPeriod === '' ? null : Number(warrantyPeriod)
    let count = 0
    for (const a of mockDb.getAssets(org.id)) {
      if (a.warrantyPeriodMonths == null && a.warrantyActivationMode == null) {
        mockDb.updateAsset(a.id, {
          warrantyPeriodMonths: Number.isFinite(periodMonths)
            ? (periodMonths as number | null)
            : null,
          warrantyActivationMode: warrantyMode,
          warrantyNotes: warrantyTerms || a.warrantyNotes,
        })
        count++
      }
    }
    setAppliedToExisting(count)
    setTimeout(() => setAppliedToExisting(null), 3000)
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
          <p className="text-sm text-gray-500">
            Manage your ThingDaddy member profile and identity.
          </p>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General Info</TabsTrigger>
          <TabsTrigger value="gs1">GS1 Application</TabsTrigger>
          <TabsTrigger value="domain">Domain & Subdomain</TabsTrigger>
          {isEnabled('WARRANTY_MANAGEMENT') && (
            <TabsTrigger value="warranty">Warranty</TabsTrigger>
          )}
          {isEnabled('AUTO_DISCOVERY') && (
            <TabsTrigger value="discovery">Discovery</TabsTrigger>
          )}
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="mt-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Organization Name
              </label>
              <input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  GS1 Company Prefix
                </label>
                <div className="flex items-center gap-2 rounded-lg py-2 px-3 bg-gray-50 ring-1 ring-inset ring-gray-200 text-sm font-mono text-gray-700">
                  {org.companyPrefix}
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-gray-400">
                    Locked
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  GLN Number
                </label>
                <div className="rounded-lg py-2 px-3 bg-gray-50 ring-1 ring-inset ring-gray-200 text-sm font-mono text-gray-700">
                  gln-{org.companyPrefix}-pending
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Registered
                </label>
                <div className="rounded-lg py-2 px-3 bg-gray-50 ring-1 ring-inset ring-gray-200 text-sm text-gray-700">
                  {new Date(org.createdAt).toISOString().slice(0, 10)}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Status
                </label>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-700 border-emerald-200">
                  ● Active
                </span>
              </div>
            </div>
          </div>
          <SaveBar onSave={saveGeneral} savedAt={generalSavedAt} />
        </TabsContent>

        {/* GS1 Application */}
        <TabsContent value="gs1" className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">
              {gs1._lastUpdatedAt
                ? `Last updated: ${new Date(gs1._lastUpdatedAt).toLocaleString()}`
                : 'Never updated'}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fillGs1Demo}
              className="gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5" />
              Fill Demo Data
            </Button>
          </div>
          <Gs1ThailandForm
            value={gs1}
            onChange={setGs1}
            companyPrefix={org.companyPrefix}
          />
          <SaveBar onSave={saveGs1} savedAt={gs1SavedAt} />
        </TabsContent>

        {/* Domain */}
        <TabsContent value="domain" className="mt-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Your Domain
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="abc.com"
                  className="block w-full rounded-lg border-0 py-2 pl-9 text-sm shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
                  Your ThingDaddy Subdomain
                </p>
                <p className="mt-1 font-mono text-sm font-bold text-indigo-900 break-all">
                  {subdomain || '—'}
                </p>
              </div>
              {loginPreview && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
                    Login preview
                  </p>
                  <p className="mt-1 font-mono text-sm text-indigo-900 break-all">
                    {loginPreview}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-600">
              <p className="font-semibold text-gray-700 mb-1">
                Warranty page preview
              </p>
              <p>
                Your Things are accessible at{' '}
                <span className="font-mono text-indigo-700">
                  {subdomain || 'subdomain'}/thing/{'{id}'}
                </span>
              </p>
              {sampleAssetId && (
                <Link
                  to="/thing/$thingId"
                  params={{ thingId: sampleAssetId }}
                  className="inline-flex items-center gap-1 mt-2 text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Open sample warranty page
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
              <p className="mt-2 text-[10px] text-gray-500">
                Map your own domain to ThingDaddy warranty pages (coming soon).
              </p>
            </div>
          </div>
          <SaveBar onSave={saveDomain} savedAt={domainSavedAt} />
        </TabsContent>

        {/* Warranty */}
        {isEnabled('WARRANTY_MANAGEMENT') && (
        <TabsContent value="warranty" className="mt-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Default Warranty Settings
                </h3>
                <p className="text-xs text-gray-500">
                  Pre-fill warranty fields when registering new Things.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Default Period
                </label>
                <select
                  value={warrantyPeriod}
                  onChange={(e) => setWarrantyPeriod(e.target.value)}
                  className={inputCls}
                >
                  <option value="">No warranty</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                  <option value="24">24 months</option>
                  <option value="36">36 months</option>
                  <option value="60">60 months</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Default Activation Mode
                </label>
                <select
                  value={warrantyMode}
                  onChange={(e) =>
                    setWarrantyMode(e.target.value as WarrantyActivationMode)
                  }
                  className={inputCls}
                >
                  <option value="owner_only">Manual by Owner</option>
                  <option value="manual">Manual — Customer activates via QR</option>
                  <option value="auto_first_scan">Auto on First Scan</option>
                  <option value="auto_immediate">Auto on Registration</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Default Terms
              </label>
              <textarea
                rows={4}
                value={warrantyTerms}
                onChange={(e) => setWarrantyTerms(e.target.value)}
                placeholder="Standard manufacturer warranty covers defects in materials and workmanship under normal use…"
                className={inputCls + ' resize-none'}
              />
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex items-center justify-between gap-4">
              <div className="text-xs text-gray-600">
                <p className="font-semibold text-gray-700">
                  Apply to existing Things
                </p>
                <p>
                  Sets these defaults on Things in this org that don't yet
                  have warranty configured.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={applyDefaultsToExisting}
              >
                Apply now
              </Button>
            </div>
            {appliedToExisting != null && (
              <p className="text-xs text-emerald-700">
                Applied to {appliedToExisting} Thing{appliedToExisting === 1 ? '' : 's'}.
              </p>
            )}
          </div>
          <SaveBar onSave={saveWarranty} savedAt={warrantySavedAt} />
        </TabsContent>
        )}

        {/* Discovery */}
        {isEnabled('AUTO_DISCOVERY') && (
        <TabsContent value="discovery" className="mt-6">
          {discovery && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Radar className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-gray-900">Discovery & Auto-Registration</h2>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-2">
                  Auto-Registration
                </label>
                <div className="space-y-2">
                  {(
                    [
                      { v: 'off', l: 'Off', d: 'All devices require manual review' },
                      { v: 'high_confidence', l: 'High-confidence only', d: 'Auto-register when type detection is high confidence' },
                      { v: 'all', l: 'All', d: 'Register every announced device automatically' },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.v}
                      className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="autoMode"
                        value={opt.v}
                        checked={discovery.autoRegisterMode === opt.v}
                        onChange={() =>
                          setDiscovery({ ...discovery, autoRegisterMode: opt.v })
                        }
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{opt.l}</p>
                        <p className="text-xs text-gray-500">{opt.d}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Default Thing Type
                  </label>
                  <select
                    value={discovery.defaultThingType}
                    onChange={(e) =>
                      setDiscovery({
                        ...discovery,
                        defaultThingType: e.target.value as DiscoverySettings['defaultThingType'],
                      })
                    }
                    className={inputCls}
                  >
                    <option value="GIAI">GIAI (Fixed Asset)</option>
                    <option value="SGTIN">SGTIN (Consumable)</option>
                    <option value="CPI">CPI (Work in Progress)</option>
                    <option value="GSRN">GSRN (Human)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Default Warranty (months)
                  </label>
                  <input
                    type="number"
                    value={discovery.defaultWarrantyMonths}
                    onChange={(e) =>
                      setDiscovery({
                        ...discovery,
                        defaultWarrantyMonths: Number(e.target.value) || 0,
                      })
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Activation
                  </label>
                  <select
                    value={discovery.defaultActivationMode}
                    onChange={(e) =>
                      setDiscovery({
                        ...discovery,
                        defaultActivationMode: e.target.value as DiscoverySettings['defaultActivationMode'],
                      })
                    }
                    className={inputCls}
                  >
                    <option value="manual">Manual</option>
                    <option value="auto_first_scan">Auto on First Scan</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={discovery.autoPairingEnabled}
                  onChange={(e) =>
                    setDiscovery({ ...discovery, autoPairingEnabled: e.target.checked })
                  }
                />
                <span className="text-sm font-semibold text-gray-900">Enable auto-pairing</span>
                <span className="text-xs text-gray-500">Pair new sensors to nearest gateway</span>
              </label>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Naming Convention
                </label>
                <input
                  value={discovery.namingPattern}
                  onChange={(e) =>
                    setDiscovery({ ...discovery, namingPattern: e.target.value })
                  }
                  className={inputCls}
                  placeholder="{model}-{serial}"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-2">
                  Blocked MAC Patterns
                </label>
                <div className="space-y-2">
                  {discovery.blockedMacs.length === 0 && (
                    <p className="text-xs text-gray-400 italic">No blocks configured.</p>
                  )}
                  {discovery.blockedMacs.map((m) => (
                    <div
                      key={m}
                      className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs"
                    >
                      <span className="font-mono text-gray-700 flex-1">{m}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setDiscovery({
                            ...discovery,
                            blockedMacs: discovery.blockedMacs.filter((x) => x !== m),
                          })
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      value={newMacBlock}
                      onChange={(e) => setNewMacBlock(e.target.value)}
                      placeholder="A4:CF:12:* or exact MAC"
                      className={inputCls}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!newMacBlock.trim()) return
                        setDiscovery({
                          ...discovery,
                          blockedMacs: [...discovery.blockedMacs, newMacBlock.trim()],
                        })
                        setNewMacBlock('')
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <SaveBar onSave={saveDiscovery} savedAt={discoverySavedAt} />
        </TabsContent>
        )}

        {/* Members */}
        <TabsContent value="members" className="mt-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                {user?.name?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-indigo-100 text-indigo-700 border-indigo-200">
                Owner
              </span>
            </div>
            {loginPreview && (
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                  Subdomain login identity
                </p>
                <p className="mt-1 font-mono text-sm text-gray-900 break-all">
                  {loginPreview}
                </p>
              </div>
            )}
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-6 text-center">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">
                Invite team members
              </p>
              <p className="text-xs text-gray-500 mt-1">Coming soon</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}
