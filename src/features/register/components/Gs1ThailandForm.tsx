import { Box } from 'lucide-react'
import type {
  GS1Address,
  GS1ApplicationData,
  GS1Contact,
  GS1MainProduct,
  IncomeBracket,
  UdiPurpose,
  FtiMembership,
} from '../types'

interface Props {
  value: GS1ApplicationData
  onChange: (next: GS1ApplicationData) => void
  companyPrefix?: string
}

const inputCls =
  'block w-full rounded-lg border-0 py-2 px-3 text-sm shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 transition-all'

const sectionCls =
  'rounded-2xl border border-amber-100 bg-amber-50/40 p-5 space-y-4'

const sectionTitleCls =
  'text-xs font-bold uppercase tracking-wider text-amber-900'

function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}

function Text({
  value = '',
  onChange,
  placeholder,
}: {
  value?: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls}
    />
  )
}

function AddressGrid({
  value = {},
  onChange,
}: {
  value?: GS1Address
  onChange: (next: GS1Address) => void
}) {
  const set = <K extends keyof GS1Address>(k: K, v: GS1Address[K]) =>
    onChange({ ...value, [k]: v })
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Field label="No.">
        <Text value={value.no} onChange={(v) => set('no', v)} />
      </Field>
      <Field label="Moo">
        <Text value={value.moo} onChange={(v) => set('moo', v)} />
      </Field>
      <Field label="Soi">
        <Text value={value.soi} onChange={(v) => set('soi', v)} />
      </Field>
      <Field label="Building / Village">
        <Text value={value.building} onChange={(v) => set('building', v)} />
      </Field>
      <Field label="Road" className="sm:col-span-2">
        <Text value={value.road} onChange={(v) => set('road', v)} />
      </Field>
      <Field label="Sub-district">
        <Text
          value={value.subDistrict}
          onChange={(v) => set('subDistrict', v)}
        />
      </Field>
      <Field label="District">
        <Text value={value.district} onChange={(v) => set('district', v)} />
      </Field>
      <Field label="Province">
        <Text value={value.province} onChange={(v) => set('province', v)} />
      </Field>
      <Field label="Area code">
        <Text value={value.areaCode} onChange={(v) => set('areaCode', v)} />
      </Field>
      <Field label="Telephone No.">
        <Text value={value.telephone} onChange={(v) => set('telephone', v)} />
      </Field>
      <Field label="Fax No.">
        <Text value={value.fax} onChange={(v) => set('fax', v)} />
      </Field>
      <Field label="E-mail" className="sm:col-span-2">
        <Text value={value.email} onChange={(v) => set('email', v)} />
      </Field>
      <Field label="Web site" className="sm:col-span-2">
        <Text value={value.website} onChange={(v) => set('website', v)} />
      </Field>
    </div>
  )
}

function ContactBlock({
  label,
  value = {},
  onChange,
}: {
  label: string
  value?: GS1Contact
  onChange: (next: GS1Contact) => void
}) {
  const set = <K extends keyof GS1Contact>(k: K, v: GS1Contact[K]) =>
    onChange({ ...value, [k]: v })
  return (
    <div className="rounded-xl bg-white border border-amber-100 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900 mb-3">
        {label}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Name">
          <Text value={value.name} onChange={(v) => set('name', v)} />
        </Field>
        <Field label="Position">
          <Text value={value.position} onChange={(v) => set('position', v)} />
        </Field>
        <Field label="Phone">
          <Text value={value.phone} onChange={(v) => set('phone', v)} />
        </Field>
        <Field label="Ext.">
          <Text value={value.ext} onChange={(v) => set('ext', v)} />
        </Field>
        <Field label="Fax">
          <Text value={value.fax} onChange={(v) => set('fax', v)} />
        </Field>
        <Field label="E-mail">
          <Text value={value.email} onChange={(v) => set('email', v)} />
        </Field>
      </div>
    </div>
  )
}

const INCOME_BRACKETS: { id: IncomeBracket; label: string }[] = [
  { id: 'lt5m_1500', label: 'Less than 5 million → 1,500 Baht/Year' },
  { id: 'lt5m_3000', label: 'Less than 5 million → 3,000 Baht/Year' },
  { id: '5to50m', label: '5–50 million → 8,000 Baht/Year' },
  { id: '50to100m', label: '50–100 million → 10,000 Baht/Year' },
  { id: 'gt100m', label: 'More than 100 million → 12,000 Baht/Year' },
]

const BUSINESS_TYPES = [
  { id: 'manufacturer', label: 'Manufacturer' },
  { id: 'distributor', label: 'Distributor' },
  { id: 'modern_trade', label: 'Modern Trade' },
  { id: 'wholesaler', label: 'Wholesaler' },
  { id: 'exporter', label: 'Exporter' },
  { id: 'otop', label: 'OTOP' },
]

const FTI_OPTIONS: { id: FtiMembership; label: string }[] = [
  { id: 'member', label: 'Member' },
  { id: 'non-member', label: 'Non-member' },
  { id: 'pending', label: 'Pending' },
]

export default function Gs1ThailandForm({ value, onChange, companyPrefix }: Props) {
  const set = <K extends keyof GS1ApplicationData>(
    k: K,
    v: GS1ApplicationData[K],
  ) => onChange({ ...value, [k]: v })

  const today = new Date().toISOString().slice(0, 10)
  const glnDisplay = companyPrefix
    ? `gln-${companyPrefix}-pending`
    : 'pending company prefix'

  return (
    <div className="space-y-5">
      {/* Orange ThingDaddy header */}
      <div className="rounded-2xl overflow-hidden border border-amber-200 shadow-sm">
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 px-5 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/95 text-orange-600 flex items-center justify-center shrink-0 shadow-sm">
            <Box className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Application Form for ThingDaddy Member
            </h2>
            <p className="text-[11px] text-orange-50/90">
              Modeled on the GS1 Thailand Member Application Form
            </p>
          </div>
        </div>
        <div className="bg-white px-5 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="GLN Number (Officer only)">
            <input
              readOnly
              value={glnDisplay}
              className="block w-full rounded-lg border-0 py-2 px-3 text-sm font-mono bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-200"
            />
          </Field>
          <Field label="Date">
            <input
              readOnly
              value={today}
              className="block w-full rounded-lg border-0 py-2 px-3 text-sm font-mono bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-200"
            />
          </Field>
        </div>
      </div>

      {/* Member Name */}
      <section className={sectionCls}>
        <h3 className={sectionTitleCls}>Member Name</h3>
        <Text
          value={value.memberName}
          onChange={(v) => set('memberName', v)}
          placeholder="Full registered company name"
        />
      </section>

      {/* Office Address */}
      <section className={sectionCls}>
        <h3 className={sectionTitleCls}>Address — Office Address</h3>
        <AddressGrid
          value={value.officeAddress}
          onChange={(next) => set('officeAddress', next)}
        />
      </section>

      {/* Tax Address */}
      <section className={sectionCls}>
        <h3 className={sectionTitleCls}>Tax Address</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Tax ID">
            <Text value={value.taxId} onChange={(v) => set('taxId', v)} />
          </Field>
          <div className="flex items-end gap-4">
            <label className="inline-flex items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={value.taxAddressSameAsOffice ?? false}
                onChange={(e) =>
                  set('taxAddressSameAsOffice', e.target.checked)
                }
                className="rounded border-gray-300"
              />
              Same office Address
            </label>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-2">
          <label className="inline-flex items-center gap-1.5 text-xs text-gray-700">
            <input
              type="radio"
              name="taxOfficeType"
              checked={value.taxOfficeType === 'head'}
              onChange={() => set('taxOfficeType', 'head')}
            />
            Head Office
          </label>
          <label className="inline-flex items-center gap-1.5 text-xs text-gray-700">
            <input
              type="radio"
              name="taxOfficeType"
              checked={value.taxOfficeType === 'branch'}
              onChange={() => set('taxOfficeType', 'branch')}
            />
            Branch
          </label>
          {value.taxOfficeType === 'branch' && (
            <input
              type="text"
              placeholder="Branch number"
              value={value.taxBranchNumber ?? ''}
              onChange={(e) => set('taxBranchNumber', e.target.value)}
              className="rounded-lg border-0 py-1.5 px-3 text-xs shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
            />
          )}
        </div>
        {!value.taxAddressSameAsOffice && (
          <AddressGrid
            value={value.taxAddress}
            onChange={(next) => set('taxAddress', next)}
          />
        )}
      </section>

      {/* Mailing Address */}
      <section className={sectionCls}>
        <h3 className={sectionTitleCls}>Mailing Address</h3>
        <label className="inline-flex items-center gap-2 text-xs text-gray-700">
          <input
            type="checkbox"
            checked={value.mailingAddressSameAsOffice ?? false}
            onChange={(e) =>
              set('mailingAddressSameAsOffice', e.target.checked)
            }
            className="rounded border-gray-300"
          />
          Same office Address
        </label>
        {!value.mailingAddressSameAsOffice && (
          <AddressGrid
            value={value.mailingAddress}
            onChange={(next) => set('mailingAddress', next)}
          />
        )}
      </section>

      {/* Contacted Person */}
      <section className={sectionCls}>
        <h3 className={sectionTitleCls}>Contacted Person</h3>
        <ContactBlock
          label="1st Authorizer"
          value={value.authorizer1}
          onChange={(next) => set('authorizer1', next)}
        />
        <ContactBlock
          label="2nd Authorizer"
          value={value.authorizer2}
          onChange={(next) => set('authorizer2', next)}
        />
        <ContactBlock
          label="Coordinated Person"
          value={value.coordinator}
          onChange={(next) => set('coordinator', next)}
        />
      </section>

      {/* Financial Data */}
      <section className={sectionCls}>
        <h3 className={sectionTitleCls}>Financial Data</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Authorized capital (THB)">
            <Text
              value={value.authorizedCapitalThb}
              onChange={(v) => set('authorizedCapitalThb', v)}
              placeholder="e.g. 5,000,000"
            />
          </Field>
          <Field label="Revenue of previous year (THB)">
            <Text
              value={value.revenuePreviousYearThb}
              onChange={(v) => set('revenuePreviousYearThb', v)}
              placeholder="e.g. 12,000,000"
            />
          </Field>
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-gray-700">Income bracket</p>
          {INCOME_BRACKETS.map((b) => (
            <label
              key={b.id}
              className="flex items-center gap-2 text-xs text-gray-700"
            >
              <input
                type="radio"
                name="incomeBracket"
                checked={value.incomeBracket === b.id}
                onChange={() => set('incomeBracket', b.id)}
              />
              {b.label}
            </label>
          ))}
        </div>
      </section>

      {/* UDI Purpose */}
      <section className={sectionCls}>
        <h3 className={sectionTitleCls}>UDI Purpose</h3>
        <p className="text-xs text-gray-700">
          Do you need GS1 barcode numbers for medical devices (UDI)?
        </p>
        <div className="space-y-2">
          {(
            [
              { id: 'yes_us', label: 'Yes — US market' },
              { id: 'yes_other', label: 'Yes — other countries (specify below)' },
              { id: 'no', label: 'No' },
            ] as { id: UdiPurpose; label: string }[]
          ).map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-2 text-xs text-gray-700"
            >
              <input
                type="radio"
                name="udiPurpose"
                checked={value.udiPurpose === opt.id}
                onChange={() => set('udiPurpose', opt.id)}
              />
              {opt.label}
            </label>
          ))}
        </div>
        {value.udiPurpose === 'yes_other' && (
          <Text
            value={value.udiOtherCountries}
            onChange={(v) => set('udiOtherCountries', v)}
            placeholder="Specify countries"
          />
        )}
      </section>

      {/* Type of Business */}
      <section className={sectionCls}>
        <h3 className={sectionTitleCls}>Type of Business</h3>
        <div className="flex flex-wrap gap-3">
          {BUSINESS_TYPES.map((b) => {
            const checked = value.businessTypes?.includes(b.id) ?? false
            return (
              <label
                key={b.id}
                className="inline-flex items-center gap-1.5 text-xs text-gray-700"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const current = value.businessTypes ?? []
                    set(
                      'businessTypes',
                      e.target.checked
                        ? [...current, b.id]
                        : current.filter((x) => x !== b.id),
                    )
                  }}
                />
                {b.label}
              </label>
            )
          })}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Product category">
            <Text
              value={value.productCategory}
              onChange={(v) => set('productCategory', v)}
            />
          </Field>
          <Field label="Amount of product (approximately)">
            <Text
              value={value.productAmount}
              onChange={(v) => set('productAmount', v)}
            />
          </Field>
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-gray-700">Main Products</p>
          {[0, 1, 2].map((i) => {
            const mp: GS1MainProduct =
              value.mainProducts?.[i] ?? {}
            return (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={`Main Product ${i + 1}`}>
                  <Text
                    value={mp.name}
                    onChange={(v) => {
                      const list = [...(value.mainProducts ?? [{}, {}, {}])]
                      list[i] = { ...list[i], name: v }
                      set('mainProducts', list)
                    }}
                  />
                </Field>
                <Field label="Brand / Logo name">
                  <Text
                    value={mp.brand}
                    onChange={(v) => {
                      const list = [...(value.mainProducts ?? [{}, {}, {}])]
                      list[i] = { ...list[i], brand: v }
                      set('mainProducts', list)
                    }}
                  />
                </Field>
              </div>
            )
          })}
        </div>
      </section>

      {/* Other Detail */}
      <section className={sectionCls}>
        <h3 className={sectionTitleCls}>Other Detail</h3>
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-gray-700">
            Federation of Thai Industries membership
          </p>
          <div className="flex flex-wrap gap-4">
            {FTI_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className="inline-flex items-center gap-1.5 text-xs text-gray-700"
              >
                <input
                  type="radio"
                  name="ftiMembership"
                  checked={value.ftiMembership === opt.id}
                  onChange={() => set('ftiMembership', opt.id)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
        <Field label="Where do you hear about ThingDaddy from?">
          <Text
            value={value.hearAboutUs}
            onChange={(v) => set('hearAboutUs', v)}
          />
        </Field>
      </section>
    </div>
  )
}
