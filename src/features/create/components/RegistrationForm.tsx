import { useState } from 'react'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '#/components/ui/command'
import { ChevronsUpDown } from 'lucide-react'
import { cn } from '#/lib/utils'
import { mockDb, type Organization } from '#/lib/mockDb'
import { COMPANY_PREFIX_DIRECTORY } from '#/lib/gs1/company-prefixes'
import type { AssetTypeId } from '../config/asset-types'

const COUNTRY_FLAGS: Record<string, string> = {
  US: '\u{1F1FA}\u{1F1F8}', TH: '\u{1F1F9}\u{1F1ED}', JP: '\u{1F1EF}\u{1F1F5}',
  GB: '\u{1F1EC}\u{1F1E7}', DE: '\u{1F1E9}\u{1F1EA}', FR: '\u{1F1EB}\u{1F1F7}',
  KR: '\u{1F1F0}\u{1F1F7}', CN: '\u{1F1E8}\u{1F1F3}', AU: '\u{1F1E6}\u{1F1FA}',
  IN: '\u{1F1EE}\u{1F1F3}', BR: '\u{1F1E7}\u{1F1F7}', CH: '\u{1F1E8}\u{1F1ED}',
  IT: '\u{1F1EE}\u{1F1F9}', ES: '\u{1F1EA}\u{1F1F8}', NL: '\u{1F1F3}\u{1F1F1}',
  SE: '\u{1F1F8}\u{1F1EA}', TW: '\u{1F1F9}\u{1F1FC}',
}

export interface FormData {
  orgId: string
  gs1CompanyPrefix: string
  namespace: string
  description: string
  indicatorDigit: string
  itemReference: string
  serialNumber: string
  componentPartReference: string
  cpiSerialNumber: string
  individualAssetReference: string
  serviceReference: string
  /** Warranty period in months as string ('', '6', '12', '24', '36', 'custom') */
  warrantyPeriodMonths: string
  /** ISO date if warrantyPeriodMonths === 'custom' */
  warrantyEndDate: string
  warrantyNotes: string
  /** How the warranty becomes active */
  warrantyActivationMode: string
}

interface RegistrationFormProps {
  assetTypeId: AssetTypeId
  formData: FormData
  errors: Record<string, string>
  onChange: (field: keyof FormData, value: string) => void
  lockedOrg?: Organization
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null
  return <p className="text-xs text-destructive mt-1">{error}</p>
}

function FieldHint({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground mt-1">{text}</p>
}

function OrgSelector({
  value,
  onChange,
  onPrefixChange,
  error,
}: {
  value: string
  onChange: (orgId: string) => void
  onPrefixChange: (prefix: string) => void
  error?: string
}) {
  const [open, setOpen] = useState(false)
  const orgs = mockDb.getAllOrgs()
  const selected = orgs.find((o) => o.id === value)

  const handleSelect = (org: Organization) => {
    onChange(org.id)
    onPrefixChange(org.companyPrefix)
    setOpen(false)
  }

  return (
    <div className="space-y-1.5 sm:col-span-2">
      <Label>Organization</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs',
              'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
              !value && 'text-muted-foreground',
            )}
          >
            {selected ? (
              <span className="truncate">
                {COUNTRY_FLAGS[selected.country] || ''} {selected.name} — {selected.companyPrefix}
              </span>
            ) : (
              'Select organization...'
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search organization..." />
            <CommandList>
              <CommandEmpty>No organization found.</CommandEmpty>
              <CommandGroup heading="Your Organizations">
                {orgs.map((org) => (
                  <CommandItem
                    key={org.id}
                    value={`${org.name} ${org.companyPrefix} ${org.nameLocal || ''}`}
                    onSelect={() => handleSelect(org)}
                    className="flex items-center gap-2"
                  >
                    <span className="text-base leading-none">{COUNTRY_FLAGS[org.country] || ''}</span>
                    <span className="flex-1 truncate text-sm">{org.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{org.companyPrefix}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <FieldError error={error} />
    </div>
  )
}

function CompanyPrefixCombobox({
  value,
  onChange,
  locked,
  error,
}: {
  value: string
  onChange: (v: string) => void
  locked: boolean
  error?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = COMPANY_PREFIX_DIRECTORY.find((c) => c.prefix === value)

  if (locked) {
    return (
      <div className="space-y-1.5">
        <Label>GS1 Company Prefix</Label>
        <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
          {selected ? (
            <span className="truncate">
              {COUNTRY_FLAGS[selected.country] || ''} {selected.name} — {selected.prefix}
            </span>
          ) : (
            <span className="font-mono">{value}</span>
          )}
        </div>
        <FieldHint text="Locked from selected organization" />
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <Label>GS1 Company Prefix</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs',
              'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
              !value && 'text-muted-foreground',
            )}
          >
            {selected ? (
              <span className="truncate">
                {COUNTRY_FLAGS[selected.country] || ''} {selected.name} — {selected.prefix}
              </span>
            ) : value ? (
              <span className="font-mono">{value}</span>
            ) : (
              'Search company or type prefix...'
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[360px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search by name or prefix..."
              onValueChange={(v) => {
                if (/^\d+$/.test(v) && v.length <= 12) onChange(v)
              }}
            />
            <CommandList>
              <CommandEmpty>
                <p className="text-sm text-muted-foreground">No company found.</p>
                <p className="text-xs text-muted-foreground mt-1">Type a custom 6–12 digit prefix.</p>
              </CommandEmpty>
              <CommandGroup>
                {COMPANY_PREFIX_DIRECTORY.map((c) => (
                  <CommandItem
                    key={c.prefix}
                    value={`${c.name} ${c.prefix} ${c.nameLocal || ''}`}
                    onSelect={() => { onChange(c.prefix); setOpen(false) }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-base leading-none">{COUNTRY_FLAGS[c.country] || ''}</span>
                    <span className="flex-1 truncate text-sm">{c.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{c.prefix}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <FieldHint text="6–12 digits" />
      <FieldError error={error} />
    </div>
  )
}

export function RegistrationForm({
  assetTypeId,
  formData,
  errors,
  onChange,
  lockedOrg,
}: RegistrationFormProps) {
  const prefixLen = formData.gs1CompanyPrefix.length
  const itemRefLen = prefixLen >= 6 && prefixLen <= 12 ? 13 - 1 - prefixLen : null
  const serviceRefLen = prefixLen >= 6 && prefixLen <= 12 ? 17 - prefixLen : null
  const hasOrg = !!formData.orgId

  const urnInstance =
    assetTypeId === 'consumable'
      ? formData.serialNumber
      : assetTypeId === 'wip'
        ? formData.cpiSerialNumber
        : assetTypeId === 'fixed'
          ? formData.individualAssetReference
          : formData.serviceReference
  const urnPreview = `urn:thingdaddy:${formData.namespace || '...'}:${assetTypeId}:${urnInstance || '...'}`

  return (
    <div className="space-y-6">
      {/* Organization + Prefix */}
      <div className="grid gap-4 sm:grid-cols-2">
        {lockedOrg ? (
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Organization</Label>
            <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
              <span className="truncate">
                {COUNTRY_FLAGS[lockedOrg.country] || ''} {lockedOrg.name} — {lockedOrg.companyPrefix}
              </span>
            </div>
            <FieldHint text="Locked to your organization" />
          </div>
        ) : (
          <OrgSelector
            value={formData.orgId}
            onChange={(id) => onChange('orgId', id)}
            onPrefixChange={(prefix) => onChange('gs1CompanyPrefix', prefix)}
            error={errors.orgId}
          />
        )}

        <CompanyPrefixCombobox
          value={formData.gs1CompanyPrefix}
          onChange={(v) => onChange('gs1CompanyPrefix', v)}
          locked={!!lockedOrg || hasOrg}
          error={errors.gs1CompanyPrefix}
        />

        <div className="space-y-1.5">
          <Label htmlFor="namespace">Namespace</Label>
          <Input
            id="namespace"
            placeholder="e.g. acme"
            value={formData.namespace}
            onChange={(e) => onChange('namespace', e.target.value.replace(/\s/g, ''))}
          />
          <FieldError error={errors.namespace} />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Optional description..."
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
          />
        </div>
      </div>

      {/* Type-Specific Fields */}
      <div className="border-t pt-5">
        <h4 className="text-sm font-semibold text-foreground mb-4">
          {assetTypeId === 'consumable' && 'SGTIN Fields'}
          {assetTypeId === 'wip' && 'CPI Fields'}
          {assetTypeId === 'fixed' && 'GIAI Fields'}
          {assetTypeId === 'human' && 'GSRN Fields'}
        </h4>

        <div className="grid gap-4 sm:grid-cols-2">
          {assetTypeId === 'consumable' && (
            <>
              <div className="space-y-1.5">
                <Label>Indicator Digit</Label>
                <Select value={formData.indicatorDigit} onValueChange={(v) => onChange('indicatorDigit', v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select 0–9" /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => (
                      <SelectItem key={i} value={String(i)}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError error={errors.indicatorDigit} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="itemReference">Item Reference</Label>
                <Input id="itemReference" placeholder="e.g. 3500106" value={formData.itemReference}
                  onChange={(e) => onChange('itemReference', e.target.value.replace(/\D/g, ''))} />
                {itemRefLen !== null && <FieldHint text={`Must be ${itemRefLen} digits for your prefix length`} />}
                <FieldError error={errors.itemReference} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input id="serialNumber" placeholder="e.g. 7654" value={formData.serialNumber}
                  onChange={(e) => onChange('serialNumber', e.target.value)} maxLength={20} />
                <FieldHint text="Alphanumeric, max 20 chars" />
                <FieldError error={errors.serialNumber} />
              </div>
            </>
          )}

          {assetTypeId === 'wip' && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="componentPartReference">Component/Part Reference</Label>
                <Input id="componentPartReference" placeholder="e.g. 999.ABC" value={formData.componentPartReference}
                  onChange={(e) => onChange('componentPartReference', e.target.value)} maxLength={30} />
                <FieldHint text="Alphanumeric (GS1 AI charset 39), max 30 chars" />
                <FieldError error={errors.componentPartReference} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cpiSerialNumber">Serial Number</Label>
                <Input id="cpiSerialNumber" placeholder="e.g. 12345" value={formData.cpiSerialNumber}
                  onChange={(e) => onChange('cpiSerialNumber', e.target.value.replace(/\D/g, ''))} maxLength={12} />
                <FieldHint text="Numeric, max 12 digits" />
                <FieldError error={errors.cpiSerialNumber} />
              </div>
            </>
          )}

          {assetTypeId === 'fixed' && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="individualAssetReference">Individual Asset Reference</Label>
              <Input id="individualAssetReference" placeholder="e.g. 32a/b" value={formData.individualAssetReference}
                onChange={(e) => onChange('individualAssetReference', e.target.value)} maxLength={30} />
              <FieldHint text="Alphanumeric (GS1 AI charset 82), max 30 chars" />
              <FieldError error={errors.individualAssetReference} />
            </div>
          )}

          {assetTypeId === 'human' && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="serviceReference">Service Reference</Label>
              <Input id="serviceReference" placeholder="e.g. 1234567890" value={formData.serviceReference}
                onChange={(e) => onChange('serviceReference', e.target.value.replace(/\D/g, ''))} />
              {serviceRefLen !== null && <FieldHint text={`Must be ${serviceRefLen} digits for your prefix length`} />}
              <FieldError error={errors.serviceReference} />
            </div>
          )}
        </div>
      </div>

      {/* URN Preview */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
        <p className="text-xs font-medium text-gray-500 mb-1.5">URN Preview</p>
        <p className="font-mono text-sm text-emerald-700 break-all">{urnPreview}</p>
      </div>
    </div>
  )
}
