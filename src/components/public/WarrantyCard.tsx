import { Shield, Calendar, Building2, Globe, FileText } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { Organization } from '#/lib/mockDb'
import { formatWarrantyDate, type WarrantyView } from '#/lib/warranty'
import type { WarrantyClaim } from '#/lib/warrantyClaims'

interface Props {
  warranty: WarrantyView
  org?: Organization
  companyPrefix?: string
  claim?: WarrantyClaim
  thingId?: string
}

const STATUS_STYLES: Record<WarrantyView['status'], string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  expiring: 'bg-amber-100 text-amber-700 border-amber-200',
  expired: 'bg-red-100 text-red-700 border-red-200',
  void: 'bg-gray-200 text-gray-800 border-gray-300',
  none: 'bg-gray-100 text-gray-700 border-gray-200',
  pending: 'bg-gray-100 text-gray-700 border-gray-200',
  awaiting_registration: 'bg-amber-100 text-amber-700 border-amber-200',
}

const STATUS_LABEL: Record<WarrantyView['status'], string> = {
  active: '● Active',
  expiring: '● Expiring Soon',
  expired: '● Expired',
  void: '● Void',
  none: 'No warranty period set',
  pending: '● Pending Activation',
  awaiting_registration: '● Awaiting Registration',
}

export default function WarrantyCard({ warranty, org, companyPrefix, claim, thingId }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">Warranty Status</h2>
          {warranty.derived && (
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
              Derived from product type
            </p>
          )}
        </div>
      </div>

      <dl className="space-y-3 text-sm">
        <Row label="Status">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[warranty.status]}`}
          >
            {STATUS_LABEL[warranty.status]}
          </span>
        </Row>
        <Row label="Registered">
          <span className="inline-flex items-center gap-1.5 text-gray-700">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {formatWarrantyDate(warranty.startDate)}
          </span>
        </Row>
        {org && (
          <Row label="Owner">
            <span className="inline-flex items-center gap-1.5 text-gray-900 font-medium">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              {org.name}
            </span>
          </Row>
        )}
        {companyPrefix && (
          <Row label="Company Prefix">
            <span className="font-mono text-gray-700">{companyPrefix}</span>
          </Row>
        )}
        {org?.domain && (
          <Row label="Domain">
            <a
              href={`https://${org.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700"
            >
              <Globe className="w-3.5 h-3.5" />
              {org.domain}
            </a>
          </Row>
        )}
        <div className="border-t border-gray-100 pt-3">
          <Row label="Warranty Valid Until">
            {warranty.endDate ? (
              <span className="font-semibold text-gray-900">
                {formatWarrantyDate(warranty.endDate)}
                {warranty.periodMonths && (
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    ({warranty.periodMonths}-month coverage)
                  </span>
                )}
              </span>
            ) : (
              <span className="text-gray-500 italic">No warranty period set</span>
            )}
          </Row>
        </div>
        {claim && (
          <>
            {claim.consumerName && (
              <Row label="Registered to">
                <span className="text-gray-900 font-medium">
                  {claim.consumerName}
                </span>
              </Row>
            )}
            <Row label="Certificate">
              <span className="font-mono text-xs text-gray-700">
                {claim.certificateNumber}
              </span>
            </Row>
          </>
        )}
        {claim && thingId && (
          <div className="pt-2">
            <Link
              to="/thing/$thingId/certificate"
              params={{ thingId }}
              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              <FileText className="w-3.5 h-3.5" />
              View certificate
            </Link>
          </div>
        )}
        {warranty.notes && (
          <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 p-3">
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1">
              Notes
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {warranty.notes}
            </p>
          </div>
        )}
      </dl>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500 shrink-0">
        {label}
      </dt>
      <dd className="text-right">{children}</dd>
    </div>
  )
}
