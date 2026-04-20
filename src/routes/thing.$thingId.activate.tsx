import { createFileRoute, redirect, useParams } from '@tanstack/react-router'
import ConsumerActivationPage from '#/features/warranty/pages/ConsumerActivationPage'
import { isEnabled } from '#/lib/feature-flags'

export const Route = createFileRoute('/thing/$thingId/activate')({
  beforeLoad: ({ params }) => {
    if (!isEnabled('CONSUMER_WARRANTY')) {
      throw redirect({
        to: '/thing/$thingId',
        params: { thingId: params.thingId },
      })
    }
  },
  component: ActivateRoute,
})

function ActivateRoute() {
  const { thingId } = useParams({ from: '/thing/$thingId/activate' })
  return <ConsumerActivationPage thingId={thingId} />
}
