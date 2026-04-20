import { createFileRoute, Outlet, useLocation, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '#/components/animate-ui/components/radix/sidebar'
import { AppSidebar } from '#/components/layouts/AppSidebar'
import { ChevronRight } from 'lucide-react'
import { auth } from '#/lib/auth'
import { seedCloudDemo } from '#/lib/cloudSeed'
import { seedRulesDemo } from '#/lib/rulesSeed'
import { seedDiscoveryDemo } from '#/lib/discoverySeed'
import { seedEconomyDemo } from '#/lib/economySeed'
import { isEnabled } from '#/lib/feature-flags'

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  // Auth guard: redirect to login if not authenticated
  useEffect(() => {
    if (!auth.isAuthenticated()) {
      navigate({ to: '/login', replace: true })
    }
  }, [navigate])

  // Seed demo data once per browser — only for features that are enabled
  useEffect(() => {
    if (isEnabled('CLOUD_CONNECTOR')) seedCloudDemo()
    if (isEnabled('RULES_ENGINE')) seedRulesDemo()
    if (isEnabled('AUTO_DISCOVERY')) seedDiscoveryDemo()
    if (isEnabled('MACHINE_ECONOMY')) seedEconomyDemo()
  }, [])

  // Hidden admin panel shortcut: Ctrl+Shift+F
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault()
        navigate({ to: '/admin/features' as any })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  const paths = location.pathname.split('/').filter(Boolean)
  const currentPath = paths.length > 0 ? paths[paths.length - 1] : 'Dashboard'
  const capitalizedPath = currentPath.charAt(0).toUpperCase() + currentPath.slice(1).replace('-', ' ')

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4">
          <SidebarTrigger className="-ml-1 text-gray-500 hover:text-gray-900" />
          <div className="w-px h-4 bg-gray-200 mx-2" />
          <nav aria-label="Breadcrumb" className="flex items-center text-sm font-medium text-gray-500">
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-900 transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="text-gray-900">{capitalizedPath}</span>
          </nav>
        </header>

        <main className="flex flex-1 flex-col">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
