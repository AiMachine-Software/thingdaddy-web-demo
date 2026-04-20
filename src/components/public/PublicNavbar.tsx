import { Link, useLocation } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowLeftRight,
  Box,
  ChevronRight,
  DollarSign,
  Globe,
  Grid,
  HelpCircle,
  Menu,
  Pencil,
  Search,
  SearchCheck,
  Tag,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { auth } from '#/lib/auth'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import {
  COMING_SOON_LABEL,
  MEGA_BOTTOM_ITEMS,
  MEGA_MAIN_ITEMS,
  type MegaIconKey,
  type MegaMainItem,
  type MegaSubItem,
} from './PublicMegaMenu'

const ICON_MAP: Record<MegaIconKey, LucideIcon> = {
  search: Search,
  'arrow-left-right': ArrowLeftRight,
  grid: Grid,
  zap: Zap,
  'dollar-sign': DollarSign,
  tag: Tag,
  globe: Globe,
  pencil: Pencil,
  'search-check': SearchCheck,
}

function SubItemRow({
  item,
  onNavigate,
}: {
  item: MegaSubItem
  onNavigate: () => void
}) {
  const Icon = item.icon ? ICON_MAP[item.icon] : null
  const inner = (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg w-full">
      {Icon && (
        <Icon className="w-4 h-4 text-gray-500 shrink-0" strokeWidth={1.75} />
      )}
      <span className="text-sm font-medium text-gray-900">{item.thai}</span>
    </div>
  )

  if (item.disabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="opacity-50 cursor-not-allowed select-none rounded-lg">
            {inner}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">{COMING_SOON_LABEL}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Link
      to={item.href!}
      onClick={onNavigate}
      className="block rounded-lg hover:bg-amber-50 transition-colors"
    >
      {inner}
    </Link>
  )
}

function MainItemRow({
  item,
  isActive,
  onSelect,
}: {
  item: MegaMainItem
  isActive: boolean
  onSelect: () => void
}) {
  const inner = (
    <div
      className={`flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg w-full text-left transition-colors ${
        isActive
          ? 'bg-amber-100 text-amber-900'
          : 'text-gray-800 hover:bg-gray-50'
      }`}
    >
      <span className="text-sm font-semibold">
        {item.thai}
        {item.badge && <sup className="ml-0.5 text-[10px]">{item.badge}</sup>}
      </span>
      {item.hasArrow && (
        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
      )}
    </div>
  )

  if (item.groups) {
    return (
      <button type="button" onClick={onSelect} className="w-full">
        {inner}
      </button>
    )
  }

  if (item.disabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="opacity-50 cursor-not-allowed select-none">
            {inner}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">{COMING_SOON_LABEL}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Link to={item.href!} className="block">
      {inner}
    </Link>
  )
}

function HamburgerMegaMenu() {
  const [open, setOpen] = useState(false)
  const firstWithGroups = MEGA_MAIN_ITEMS.find((m) => m.groups)
  const [activeMain, setActiveMain] = useState<MegaMainItem | null>(
    firstWithGroups ?? null,
  )
  const [showRightMobile, setShowRightMobile] = useState(false)

  const handleSelectMain = (item: MegaMainItem) => {
    setActiveMain(item)
    if (item.groups) setShowRightMobile(true)
  }

  const closeSheet = () => {
    setOpen(false)
    setShowRightMobile(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
        >
          <Menu className="w-6 h-6" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-full sm:max-w-xl md:max-w-3xl p-0 flex flex-col"
      >
        <SheetHeader className="px-5 py-4 border-b">
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 min-h-0">
          {/* Left panel */}
          <div
            className={`${
              showRightMobile ? 'hidden md:flex' : 'flex'
            } flex-col w-full md:w-64 md:border-r md:bg-gray-50/40 overflow-y-auto`}
          >
            <nav className="flex flex-col gap-1 p-3">
              {MEGA_MAIN_ITEMS.map((item) => (
                <MainItemRow
                  key={item.thai}
                  item={item}
                  isActive={activeMain?.thai === item.thai}
                  onSelect={() => handleSelectMain(item)}
                />
              ))}
            </nav>
            <div className="mt-auto border-t p-3 flex flex-col gap-1">
              {MEGA_BOTTOM_ITEMS.map((item) => (
                <Tooltip key={item.thai}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg opacity-50 cursor-not-allowed text-sm font-semibold text-gray-700 select-none">
                      {item.thai === 'Help Center' && (
                        <HelpCircle className="w-4 h-4 text-gray-500" />
                      )}
                      <span>{item.thai}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">{COMING_SOON_LABEL}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div
            className={`${
              showRightMobile ? 'flex' : 'hidden md:flex'
            } flex-col flex-1 overflow-y-auto`}
          >
            {activeMain?.groups ? (
              <div className="p-5">
                <button
                  type="button"
                  onClick={() => setShowRightMobile(false)}
                  className="md:hidden inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <h2 className="text-base font-bold text-gray-900 mb-4 hidden md:block">
                  {activeMain.thai}
                </h2>
                <div className="space-y-6">
                  {activeMain.groups.map((group, gi) => (
                    <div key={group.title ?? gi}>
                      {group.title && (
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 px-3">
                          {group.title}
                        </p>
                      )}
                      <div className="flex flex-col gap-0.5">
                        {group.items.map((sub) => (
                          <SubItemRow
                            key={sub.thai}
                            item={sub}
                            onNavigate={closeSheet}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="hidden md:flex flex-1 items-center justify-center text-sm text-gray-400">
                Select a menu on the left
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function AuthedAvatar({ user }: { user: any }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg hover:ring-2 hover:ring-indigo-600 hover:ring-offset-2 transition-all focus:outline-none shadow-sm"
        title="Open user menu"
      >
        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
            <div className="py-3 px-4 border-b border-gray-50 bg-gray-50/50">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {user?.email}
              </p>
            </div>
            <div className="py-1">
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
              >
                Dashboard
              </Link>
              <Link
                to="/create"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
              >
                Register Thing
              </Link>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={() => {
                  auth.logout().then(() => {
                    setOpen(false)
                    window.location.href = '/'
                  })
                }}
                className="block w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function PublicNavbar() {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setIsAuthenticated(auth.isAuthenticated())
    setUser(auth.getCurrentUser())
  }, [location.pathname])

  return (
    <TooltipProvider delayDuration={150}>
      <nav className="h-16 sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-2">
              <HamburgerMegaMenu />
              <Link to="/" className="flex items-center gap-2.5 group shrink-0">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-700 transition-colors">
                  <Box className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">
                  Thing<span className="text-indigo-600">Daddy</span>
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {isAuthenticated ? (
                <AuthedAvatar user={user} />
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-semibold text-gray-700 hover:text-indigo-600 hidden sm:block"
                  >
                    เข้าสู่ระบบ / Sign In
                  </Link>
                  <Button
                    asChild
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Link to="/register">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  )
}
