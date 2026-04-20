import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, ArrowRight, Save } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { mockDb, type Organization, type WarrantyActivationMode } from '#/lib/mockDb'
import { requireOrgId } from '#/lib/tenant'
import {
  buildSgtinElementString,
  buildCpiElementString,
  buildGiaiElementString,
  buildGsrnElementString,
  buildSgtinUri,
  buildCpiUri,
  buildGiaiUri,
  buildGsrnUri,
  buildSgtinTagUri,
  buildCpiTagUri,
  buildGiaiTagUri,
  buildGsrnTagUri,
  encodeToHex,
  buildSgtinDigitalLink,
  buildGiaiDigitalLink,
  buildCpiDigitalLink,
  buildGsrnDigitalLink,
} from '#/lib/gs1'
import { ASSET_TYPES, type AssetTypeId } from '../config/asset-types'
import {
  THING_TYPES_BY_CODE,
  recommendedFor,
  assetTypeForThingCode,
} from '../config/thing-types'
import { StepIndicator } from '../components/StepIndicator'
import { AssetTypeCard } from '../components/AssetTypeCard'
import { type FormData } from '../components/RegistrationForm'
import ThingTypeGrid from '../components/ThingTypeGrid'
import Gs1OrangeForm from '../components/Gs1OrangeForm'
import Gs1StubForm from '../components/Gs1StubForm'
import { IdentifierPreview } from '../components/IdentifierPreview'
import { THING_DEMO_DATA, type DemoEncoder } from '../lib/demoData'

const STEPS = ['Asset Type', 'Thing Type', 'Details', 'Identifiers']

const INITIAL_FORM: FormData = {
  orgId: '',
  gs1CompanyPrefix: '',
  namespace: '',
  description: '',
  indicatorDigit: '0',
  itemReference: '',
  serialNumber: '',
  componentPartReference: '',
  cpiSerialNumber: '',
  individualAssetReference: '',
  serviceReference: '',
  warrantyPeriodMonths: '',
  warrantyEndDate: '',
  warrantyNotes: '',
  warrantyActivationMode: 'owner_only',
}

function validate(
  form: FormData,
  assetTypeId: AssetTypeId,
): Record<string, string> {
  const errors: Record<string, string> = {}

  // Common
  if (!form.orgId) {
    errors.orgId = 'Please select an organization'
  }

  if (!form.gs1CompanyPrefix) {
    errors.gs1CompanyPrefix = 'Required'
  } else if (!/^\d{6,12}$/.test(form.gs1CompanyPrefix)) {
    errors.gs1CompanyPrefix = 'Must be 6–12 digits'
  }

  if (!form.namespace.trim()) {
    errors.namespace = 'Required'
  }

  const prefixLen = form.gs1CompanyPrefix.length

  // Type-specific
  if (assetTypeId === 'consumable') {
    if (!form.itemReference) {
      errors.itemReference = 'Required'
    } else if (!/^\d+$/.test(form.itemReference)) {
      errors.itemReference = 'Must be numeric'
    } else if (prefixLen >= 6 && prefixLen <= 12) {
      const expected = 13 - 1 - prefixLen
      if (form.itemReference.length > expected) {
        errors.itemReference = `Max ${expected} digits for your prefix`
      }
    }
    if (!form.serialNumber.trim()) {
      errors.serialNumber = 'Required'
    }
  }

  if (assetTypeId === 'wip') {
    if (!form.componentPartReference.trim()) {
      errors.componentPartReference = 'Required'
    }
    if (!form.cpiSerialNumber) {
      errors.cpiSerialNumber = 'Required'
    } else if (!/^\d+$/.test(form.cpiSerialNumber)) {
      errors.cpiSerialNumber = 'Must be numeric'
    }
  }

  if (assetTypeId === 'fixed') {
    if (!form.individualAssetReference.trim()) {
      errors.individualAssetReference = 'Required'
    }
  }

  if (assetTypeId === 'human') {
    if (!form.serviceReference) {
      errors.serviceReference = 'Required'
    } else if (!/^\d+$/.test(form.serviceReference)) {
      errors.serviceReference = 'Must be numeric'
    } else if (prefixLen >= 6 && prefixLen <= 12) {
      const expected = 17 - prefixLen
      if (form.serviceReference.length > expected) {
        errors.serviceReference = `Max ${expected} digits for your prefix`
      }
    }
  }

  return errors
}

export default function CreatePage() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { thingType?: string }
  const [step, setStep] = useState(1)
  const [assetTypeId, setAssetTypeId] = useState<AssetTypeId | null>(null)
  const [thingTypeCode, setThingTypeCode] = useState<string | null>(null)
  const preselectAppliedRef = useRef(false)

  // Lock org to current user's org
  const orgId = requireOrgId()
  const lockedOrg = mockDb.getOrgById(orgId) as Organization
  const [formData, setFormData] = useState<FormData>(() => ({
    ...INITIAL_FORM,
    orgId: lockedOrg.id,
    gs1CompanyPrefix: lockedOrg.companyPrefix,
    warrantyPeriodMonths: lockedOrg.warrantyDefaults?.periodMonths != null
      ? String(lockedOrg.warrantyDefaults.periodMonths)
      : INITIAL_FORM.warrantyPeriodMonths,
    warrantyActivationMode:
      lockedOrg.warrantyDefaults?.activationMode ?? INITIAL_FORM.warrantyActivationMode,
    warrantyNotes:
      lockedOrg.warrantyDefaults?.terms ?? INITIAL_FORM.warrantyNotes,
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tagSize, setTagSize] = useState('198')
  const [filterValue, setFilterValue] = useState('0')

  const handleFieldChange = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => {
        if (prev[field]) {
          const next = { ...prev }
          delete next[field]
          return next
        }
        return prev
      })
    },
    [],
  )

  // When asset type changes, reset tag size and pre-pick the recommended Thing Type
  const handleSelectAssetType = useCallback((id: AssetTypeId) => {
    setAssetTypeId(id)
    if (id === 'consumable') setTagSize('198')
    else if (id === 'fixed') setTagSize('202')
    else setTagSize('96')
    const rec = recommendedFor(id)
    if (rec.length > 0) setThingTypeCode(rec[0])
  }, [])

  const handleSelectThingType = useCallback((code: string) => {
    setThingTypeCode(code)
    const meta = THING_TYPES_BY_CODE[code]
    // Sync the asset type so identifiers + validation key off the right group
    if (meta?.encoder) {
      const id = assetTypeForThingCode(code)
      if (id && id !== assetTypeId) {
        setAssetTypeId(id)
      }
    }
  }, [assetTypeId])

  // Pre-select from ?thingType= query param (from public search)
  useEffect(() => {
    if (preselectAppliedRef.current) return
    const code = search?.thingType
    if (!code) return
    const meta = THING_TYPES_BY_CODE[code.toUpperCase()] ?? THING_TYPES_BY_CODE[code]
    if (!meta) return
    preselectAppliedRef.current = true
    const id = assetTypeForThingCode(code)
    if (id) handleSelectAssetType(id)
    setThingTypeCode(meta.code)
    setStep(meta.encoder ? 3 : 2)
  }, [search?.thingType, handleSelectAssetType])

  const selectedThing = thingTypeCode ? THING_TYPES_BY_CODE[thingTypeCode] : null
  const hasEncoder = !!selectedThing?.encoder

  const goNext = () => {
    if (step === 1 && assetTypeId) {
      setStep(2)
    } else if (step === 2 && thingTypeCode && hasEncoder) {
      setStep(3)
    } else if (step === 3 && assetTypeId) {
      const errs = validate(formData, assetTypeId)
      if (Object.keys(errs).length > 0) {
        setErrors(errs)
        return
      }
      setErrors({})
      setStep(4)
    }
  }

  const handleFillDemo = useCallback(() => {
    if (!selectedThing?.encoder) return
    const code = selectedThing.code as DemoEncoder
    const demo = THING_DEMO_DATA[code]
    if (!demo) return
    setFormData((prev) => ({ ...prev, ...demo.patch }))
    if (demo.tagSize) setTagSize(demo.tagSize)
    if (demo.filterValue) setFilterValue(demo.filterValue)
    setErrors({})
  }, [selectedThing])

  const goBack = () => {
    if (step > 1) setStep((s) => s - 1)
  }

  // Computed identifiers — live during Step 3 (orange form preview) + Step 4
  const identifiers = useMemo(() => {
    if (!assetTypeId || step < 3) return null
    if (!hasEncoder) return null
    const { gs1CompanyPrefix: prefix, namespace } = formData
    const filter = Number(filterValue)
    const size = tagSize === 'var' ? 0 : Number(tagSize)

    let elementString = ''
    let epcUri = ''
    let epcTagUri = ''
    let digitalLinkUri = ''
    let urnInstance = ''

    if (assetTypeId === 'consumable') {
      const { indicatorDigit, itemReference, serialNumber } = formData
      elementString = buildSgtinElementString(prefix, indicatorDigit, itemReference, serialNumber)
      epcUri = buildSgtinUri(prefix, indicatorDigit, itemReference, serialNumber)
      epcTagUri = buildSgtinTagUri(prefix, indicatorDigit, itemReference, serialNumber, filter, size)
      digitalLinkUri = buildSgtinDigitalLink(prefix, indicatorDigit, itemReference, serialNumber)
      urnInstance = serialNumber
    } else if (assetTypeId === 'wip') {
      const { componentPartReference, cpiSerialNumber } = formData
      elementString = buildCpiElementString(prefix, componentPartReference, cpiSerialNumber)
      epcUri = buildCpiUri(prefix, componentPartReference, cpiSerialNumber)
      epcTagUri = buildCpiTagUri(prefix, componentPartReference, cpiSerialNumber, filter, size)
      digitalLinkUri = buildCpiDigitalLink(prefix, componentPartReference, cpiSerialNumber)
      urnInstance = cpiSerialNumber
    } else if (assetTypeId === 'fixed') {
      const { individualAssetReference } = formData
      elementString = buildGiaiElementString(prefix, individualAssetReference)
      epcUri = buildGiaiUri(prefix, individualAssetReference)
      epcTagUri = buildGiaiTagUri(prefix, individualAssetReference, filter, size)
      digitalLinkUri = buildGiaiDigitalLink(prefix, individualAssetReference)
      urnInstance = individualAssetReference
    } else if (assetTypeId === 'human') {
      const { serviceReference } = formData
      elementString = buildGsrnElementString(prefix, serviceReference)
      epcUri = buildGsrnUri(prefix, serviceReference)
      epcTagUri = buildGsrnTagUri(prefix, serviceReference, filter)
      digitalLinkUri = buildGsrnDigitalLink(prefix, serviceReference)
      urnInstance = serviceReference
    }

    const rfidHex = encodeToHex(epcTagUri)
    const thingDaddyUrn = `urn:thingdaddy:${namespace}:${assetTypeId}:${urnInstance}`
    const seq = Math.random().toString(36).substring(2, 7).toUpperCase()
    const thingDaddyCpi = `urn:thingdaddy:cpi:CPI-${namespace.toUpperCase()}-${assetTypeId.toUpperCase()}-${seq}`

    return { elementString, epcUri, epcTagUri, rfidHex, digitalLinkUri, thingDaddyUrn, thingDaddyCpi }
  }, [assetTypeId, formData, step, tagSize, filterValue, hasEncoder])

  const handleSubmit = () => {
    if (!identifiers || !assetTypeId) return

    const createdAt = new Date().toISOString()

    // Compute warranty fields
    let warrantyPeriodMonths: number | null = null
    let warrantyEndDate: string | null = null
    if (formData.warrantyPeriodMonths === 'custom') {
      if (formData.warrantyEndDate) {
        warrantyEndDate = new Date(formData.warrantyEndDate).toISOString()
      }
    } else if (formData.warrantyPeriodMonths) {
      const months = Number(formData.warrantyPeriodMonths)
      if (!Number.isNaN(months) && months > 0) {
        warrantyPeriodMonths = months
        const end = new Date(createdAt)
        end.setMonth(end.getMonth() + months)
        warrantyEndDate = end.toISOString()
      }
    }

    const activationMode = formData.warrantyActivationMode as WarrantyActivationMode
    const isImmediate = activationMode === 'auto_immediate'
    const asset = {
      id: crypto.randomUUID(),
      orgId: formData.orgId,
      gs1CompanyPrefix: formData.gs1CompanyPrefix,
      namespace: formData.namespace,
      urn: identifiers.thingDaddyUrn,
      epcUri: identifiers.epcUri,
      epcTagUri: identifiers.epcTagUri,
      elementString: identifiers.elementString,
      rfid: identifiers.rfidHex,
      digitalLinkUri: identifiers.digitalLinkUri,
      type: assetTypeId,
      status: 'active' as const,
      description: formData.description || undefined,
      warrantyPeriodMonths,
      warrantyEndDate,
      warrantyNotes: formData.warrantyNotes || undefined,
      warrantyActivationMode: formData.warrantyActivationMode,
      warrantyStartDate: isImmediate ? createdAt : null,
      warrantyActivatedAt: isImmediate ? createdAt : null,
      warrantyActivatedBy: isImmediate ? 'system' : null,
      createdAt,
    }

    mockDb.saveAsset(asset)
    navigate({ to: '/list' })
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">Register a Thing</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Create a new asset with GS1-compliant identifiers
      </p>

      <StepIndicator currentStep={step} steps={STEPS} />

      <AnimatePresence mode="wait">
        {/* Step 1: Asset Type */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">Choose Asset Type</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {ASSET_TYPES.map((config) => (
                <AssetTypeCard
                  key={config.id}
                  config={config}
                  isSelected={assetTypeId === config.id}
                  onClick={() => handleSelectAssetType(config.id)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Thing Type */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Choose Thing Type
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Pick the GS1 identifier scheme. Recommended types for your Asset
              Type are highlighted.
            </p>
            <ThingTypeGrid
              assetTypeId={assetTypeId}
              selectedCode={thingTypeCode}
              onSelect={handleSelectThingType}
            />
          </motion.div>
        )}

        {/* Step 3: Registration Form ("orange page") */}
        {step === 3 && assetTypeId && selectedThing && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Registration Details
            </h2>
            {selectedThing.encoder ? (
              <Gs1OrangeForm
                thingTypeCode={selectedThing.code}
                encoder={selectedThing.encoder}
                formData={formData}
                onChange={handleFieldChange}
                errors={errors}
                lockedOrg={lockedOrg}
                tagSize={tagSize}
                filterValue={filterValue}
                onTagSizeChange={setTagSize}
                onFilterValueChange={setFilterValue}
                onFillDemo={handleFillDemo}
                identifiers={identifiers}
              />
            ) : (
              <Gs1StubForm
                thingTypeCode={selectedThing.code}
                onPickAnother={() => setStep(2)}
              />
            )}
          </motion.div>
        )}

        {/* Step 4: Identifier Chain Preview */}
        {step === 4 && assetTypeId && identifiers && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Identifier Chain Preview
            </h2>
            <IdentifierPreview
              assetTypeId={assetTypeId}
              elementString={identifiers.elementString}
              epcUri={identifiers.epcUri}
              epcTagUri={identifiers.epcTagUri}
              rfidHex={identifiers.rfidHex}
              digitalLinkUri={identifiers.digitalLinkUri}
              thingDaddyUrn={identifiers.thingDaddyUrn}
              thingDaddyCpi={identifiers.thingDaddyCpi}
              tagSize={tagSize}
              filterValue={filterValue}
              onTagSizeChange={setTagSize}
              onFilterValueChange={setFilterValue}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="mt-8 flex items-center justify-between">
        <div>
          {step > 1 && (
            <Button variant="outline" onClick={goBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
        </div>
        <div>
          {step < 4 && (
            <Button
              onClick={goNext}
              disabled={
                (step === 1 && !assetTypeId) ||
                (step === 2 && (!thingTypeCode || !hasEncoder))
              }
            >
              {step === 3 ? 'Next: Generate Identifiers' : 'Next'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {step === 4 && (
            <Button onClick={handleSubmit}>
              <Save className="mr-2 h-4 w-4" />
              Submit & Save
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
