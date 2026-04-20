import { createFileRoute, useParams } from '@tanstack/react-router'
import ThingDetailPage from '#/features/thing/pages/ThingDetailPage'

export const Route = createFileRoute('/thing/$thingId')({
  component: ThingRoute,
})

function ThingRoute() {
  const { thingId } = useParams({ from: '/thing/$thingId' })
  return <ThingDetailPage thingId={thingId} />
}
