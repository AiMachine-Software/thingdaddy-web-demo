import { useEffect } from 'react'
import {
  createFileRoute,
  useNavigate,
  useParams,
} from '@tanstack/react-router'
import { resolveByGs1DigitalLink } from '#/lib/things'
import ThingNotFound from '#/components/public/ThingNotFound'

export const Route = createFileRoute('/01/$gtin/21/$serial')({
  component: DigitalLinkResolver,
})

function DigitalLinkResolver() {
  const { gtin, serial } = useParams({ from: '/01/$gtin/21/$serial' })
  const navigate = useNavigate()

  useEffect(() => {
    const asset = resolveByGs1DigitalLink(gtin, serial)
    if (asset) {
      navigate({
        to: '/thing/$thingId',
        params: { thingId: asset.id },
        replace: true,
      })
    }
  }, [gtin, serial, navigate])

  // If we made it past the effect (no asset found), show 404
  const asset = resolveByGs1DigitalLink(gtin, serial)
  if (asset) {
    return (
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <p className="text-sm text-gray-500">Resolving Digital Link…</p>
      </main>
    )
  }
  return <ThingNotFound query={`(01) ${gtin} (21) ${serial}`} />
}
