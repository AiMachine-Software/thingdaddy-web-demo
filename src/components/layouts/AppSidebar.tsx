import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { auth } from '#/lib/auth'
import { mockDb } from '#/lib/mockDb'
import { isEnabled, type FeatureFlag } from '#/lib/feature-flags'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '#/components/animate-ui/components/radix/sidebar'
import { LayoutDashboard, Search, Box, User, ChevronRight, LogOut, ArrowRightLeft, ScrollText, Upload, ChevronsUpDown, Building2, Check, Settings, UserCircle, Cloud, Zap, Radar, Coins } from 'lucide-react'

type NavItem = {
  title: string
  url?: string
  icon: any
  items?: { title: string; url: string }[]
  /** Feature flag that must be enabled for this item to show. Omit for always-on. */
  flag?: FeatureFlag
}

const allNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Things',
    icon: Box,
    items: [
      { title: 'All Things', url: '/list' },
      { title: 'Register Thing', url: '/create' },
      { title: 'Batch Import', url: '/batch-import' },
    ],
  },
  {
    title: 'Automation',
    icon: Zap,
    flag: 'RULES_ENGINE',
    items: [
      { title: 'Rules', url: '/rules' },
      { title: 'Simulator', url: '/rules/simulator' },
    ],
  },
  {
    title: 'Cloud',
    icon: Cloud,
    flag: 'CLOUD_CONNECTOR',
    items: [
      { title: 'Resolver', url: '/cloud/resolver' },
      { title: 'Messenger', url: '/cloud/messenger' },
    ],
  },
  {
    title: 'Discovery',
    icon: Radar,
    flag: 'AUTO_DISCOVERY',
    items: [
      { title: 'Dashboard', url: '/discovery' },
      { title: 'Topology', url: '/discovery/topology' },
    ],
  },
  {
    title: 'Economy',
    icon: Coins,
    flag: 'MACHINE_ECONOMY',
    items: [
      { title: 'Dashboard', url: '/economy' },
      { title: 'Marketplace', url: '/economy/marketplace' },
      { title: 'Negotiations', url: '/economy/negotiations' },
      { title: 'Contracts', url: '/economy/contracts' },
    ],
  },
  // {
  //   title: 'Transfers',
  //   url: '/transfers',
  //   icon: ArrowRightLeft,
  // },
  {
    title: 'Audit Logs',
    url: '/audit-logs',
    icon: ScrollText,
  },
  {
    title: 'Settings',
    icon: Settings,
    flag: 'SETTINGS_PAGE',
    items: [
      { title: 'Organization', url: '/settings/organization' },
      { title: 'Profile', url: '/settings/profile' },
    ],
  },
]

const navItems = allNavItems.filter((item) => !item.flag || isEnabled(item.flag))

function CollapsibleMenuItem({ item }: { item: any }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={item.title} onClick={() => setIsOpen(!isOpen)}>
        <item.icon />
        <span>{item.title}</span>
        <ChevronRight className={`ml-auto h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </SidebarMenuButton>
      {isOpen && (
        <SidebarMenuSub>
          {item.items.map((subItem: any) => (
            <SidebarMenuSubItem key={subItem.title}>
              <SidebarMenuSubButton asChild>
                <Link to={subItem.url as any} activeProps={{ className: 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' }}>
                  <span>{subItem.title}</span>
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

const DEMO_ACCOUNTS = [
  { email: 'admin@thingdaddy.dev', password: 'password' },
  { email: 'somchai@cp.co.th', password: 'password' },
  { email: 'liwei@milesight.com', password: 'password' },
]

export function AppSidebar() {
  const navigate = useNavigate()
  const [showSwitcher, setShowSwitcher] = useState(false)
  const user = auth.getCurrentUser()
  const org = user?.orgId ? mockDb.getOrgById(user.orgId) : undefined

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    await auth.logout()
    navigate({ to: '/' })
  }

  const handleSwitchAccount = async (email: string, password: string) => {
    await auth.login(email, password)
    setShowSwitcher(false)
    window.location.href = '/dashboard'
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="hover:bg-sidebar-accent cursor-pointer">
              <Link to="/">
                <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 transition-colors">
                  <Box size={18} className="text-white" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden w-full">
                  <span className="text-xl font-bold text-gray-900 tracking-tight truncate">
                    Thing<span className="text-indigo-600">Daddy</span>
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {/* Org context */}
        {org && (
          <div className="px-3 py-2 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Building2 size={14} className="text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-gray-700 truncate">{org.name}</p>
                <p className="font-mono text-gray-400">{org.companyPrefix}</p>
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <div key={item.title}>
                  {item.items ? (
                    <CollapsibleMenuItem item={item} />
                  ) : (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <Link to={item.url as any} activeProps={{ className: 'bg-sidebar-accent' }}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="relative">
              <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent group/user" onClick={() => setShowSwitcher(!showSwitcher)}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
                  <User size={16} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold text-gray-900">
                    {user?.name || 'Guest'}
                  </span>
                  <span className="truncate text-xs text-gray-500">
                    {org?.name || user?.email || 'Not connected'}
                  </span>
                </div>
                <ChevronsUpDown size={16} className="text-gray-400 group-data-[collapsible=icon]:hidden shrink-0" />
              </SidebarMenuButton>
              {showSwitcher && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-xl border border-gray-200 shadow-lg p-1 z-50 group-data-[collapsible=icon]:left-full group-data-[collapsible=icon]:bottom-0 group-data-[collapsible=icon]:ml-2 group-data-[collapsible=icon]:w-64">
                  <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Switch Account</p>
                  {DEMO_ACCOUNTS.map(acc => {
                    const isCurrent = user?.email === acc.email
                    return (
                      <button key={acc.email} onClick={() => !isCurrent && handleSwitchAccount(acc.email, acc.password)}
                        className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-left transition-colors ${isCurrent ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'}`}>
                        <div className="flex aspect-square size-6 items-center justify-center rounded-md bg-gray-100 text-gray-500 shrink-0">
                          {isCurrent ? <Check size={12} className="text-indigo-600" /> : <User size={12} />}
                        </div>
                        <span className="truncate text-xs font-medium">{acc.email}</span>
                      </button>
                    )
                  })}
                  {isEnabled('SETTINGS_PAGE') && (
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <Link
                        to="/settings/profile"
                        onClick={() => setShowSwitcher(false)}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <UserCircle size={14} />
                        <span className="text-xs font-medium">My Profile</span>
                      </Link>
                      <Link
                        to="/settings/organization"
                        onClick={() => setShowSwitcher(false)}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings size={14} />
                        <span className="text-xs font-medium">Organization Settings</span>
                      </Link>
                    </div>
                  )}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <LogOut size={14} /> <span className="text-xs font-medium">Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
