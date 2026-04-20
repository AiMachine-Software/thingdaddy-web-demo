import { createRootRoute, useMatches, Outlet } from '@tanstack/react-router'
import PublicNavbar from '#/components/public/PublicNavbar'
import AppFooter from '#/components/layouts/AppFooter'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const matches = useMatches()
  const isAuthRoute = matches.some((match) => match.routeId.startsWith('/_auth'))

  return (
    <div className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,116,184,0.24)]">
      {!isAuthRoute && <PublicNavbar />}
      <Outlet />
      {!isAuthRoute && <AppFooter />}
    </div>
  )
}
