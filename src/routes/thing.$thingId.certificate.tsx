import { createFileRoute, redirect, useParams } from '@tanstack/react-router'
import WarrantyCertificatePage from '#/features/warranty/pages/WarrantyCertificatePage'
import { isEnabled } from '#/lib/feature-flags'

export const Route = createFileRoute('/thing/$thingId/certificate')({
  beforeLoad: ({ params }) => {
    if (!isEnabled('CONSUMER_WARRANTY')) {
      throw redirect({
        to: '/thing/$thingId',
        params: { thingId: params.thingId },
      })
    }
  },
  component: CertificateRoute,
})

function CertificateRoute() {
  const { thingId } = useParams({ from: '/thing/$thingId/certificate' })
  return <WarrantyCertificatePage thingId={thingId} />
}
