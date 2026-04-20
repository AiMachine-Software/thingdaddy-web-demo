import { motion } from 'motion/react';
import { Package, Activity, PauseCircle, Archive, PlusCircle, List, Search, ArrowRight, Upload, ArrowLeftRight, ScrollText, Building2, Shield, Calendar } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { mockDb } from '#/lib/mockDb';
import { auth } from '#/lib/auth';
import { getCurrentOrgId } from '#/lib/tenant';
import { ExportImportPanel } from '#/features/settings/ExportImportPanel';
import RulesWidget from '#/features/rules/components/RulesWidget';
import NotificationFeed from '#/components/dashboard/NotificationFeed';
import DiscoveryWidget from '#/features/discovery/components/DiscoveryWidget';
import { isEnabled } from '#/lib/feature-flags';
import {
  bucketWarranties,
  formatWarrantyDate,
  getWarrantyDisplayMeta,
  listExpiringSoon,
  type WarrantyAssetEntry,
  type WarrantyBuckets,
} from '#/lib/warranty';
import { cn } from '#/lib/utils';

const quickAccessCards = [
  {
    title: 'Register a Thing',
    description: 'Create a new ThingDaddy URN with GS1 binding.',
    icon: PlusCircle,
    href: '/create',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'hover:border-blue-200',
  },
  {
    title: 'Batch Import',
    description: 'Import things from CSV or Excel files.',
    icon: Upload,
    href: '/batch-import',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'hover:border-violet-200',
  },
  {
    title: 'Resolver',
    description: 'Look up any ThingDaddy ID, GS1 ID, or RFID hex.',
    icon: Search,
    href: '/search-assets',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'hover:border-emerald-200',
  },
  {
    title: 'Things List',
    description: 'Browse, search, and manage all registered things.',
    icon: List,
    href: '/list',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'hover:border-purple-200',
  },
  // {
  //   title: 'Transfers',
  //   description: 'Transfer thing ownership between organizations.',
  //   icon: ArrowLeftRight,
  //   href: '/transfers',
  //   color: 'text-sky-600',
  //   bgColor: 'bg-sky-50',
  //   borderColor: 'hover:border-sky-200',
  // },
  {
    title: 'Audit Logs',
    description: 'Track all changes and activities.',
    icon: ScrollText,
    href: '/audit-logs',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'hover:border-amber-200',
  },
];

export default function DashboardPage() {
  const [counts, setCounts] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    retired: 0,
  });
  const [orgCount, setOrgCount] = useState(0);
  const [pendingTransfers, setPendingTransfers] = useState(0);
  const [warrantyBuckets, setWarrantyBuckets] = useState<WarrantyBuckets>({
    active: 0,
    expiring: 0,
    expired: 0,
    void: 0,
    none: 0,
    total: 0,
    byStatus: [],
  });
  const [expiringList, setExpiringList] = useState<WarrantyAssetEntry[]>([]);

  useEffect(() => {
    const orgId = getCurrentOrgId() || undefined;
    setCounts(mockDb.getThingStats(orgId));
    setOrgCount(mockDb.getAllOrgs().length);
    setPendingTransfers(mockDb.getTransfers({ status: 'pending', orgId }).length);
    const orgAssets = mockDb.getAssets(orgId);
    setWarrantyBuckets(bucketWarranties(orgAssets));
    setExpiringList(listExpiringSoon(orgAssets, 5));
  }, []);

  const stats = [
    { name: 'Total Things', value: counts.total.toString(), icon: Package, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    { name: 'Active', value: counts.active.toString(), icon: Activity, color: 'text-green-600', bgColor: 'bg-green-50' },
    { name: 'Suspended', value: counts.suspended.toString(), icon: PauseCircle, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { name: 'Retired', value: counts.retired.toString(), icon: Archive, color: 'text-gray-600', bgColor: 'bg-gray-50' },
    // { name: 'Organizations', value: orgCount.toString(), icon: Building2, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    // { name: 'Pending Transfers', value: pendingTransfers.toString(), icon: ArrowLeftRight, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  ];

  const currentUser = auth.getCurrentUser()
  const currentOrg = currentUser?.orgId ? mockDb.getOrgById(currentUser.orgId) : undefined

  return (
    <main className="min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          {currentUser ? `Welcome back, ${currentUser.name}` : 'Dashboard'}
        </h1>
        <p className="text-gray-500 mt-2">
          {currentOrg ? `${currentOrg.name} — ` : ''}Overview of your ThingDaddy ecosystem.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.bgColor}`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <p className="text-xs font-medium text-gray-500">{stat.name}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Warranty Overview */}
      {isEnabled('WARRANTY_MANAGEMENT') && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-12 bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Warranty Overview</h2>
              <p className="text-xs text-gray-500">
                Status across {warrantyBuckets.total} {warrantyBuckets.total === 1 ? 'thing' : 'things'}.
              </p>
            </div>
          </div>
          <Link
            to="/list"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
          >
            View All Warranties
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {(
            [
              { key: 'active', label: 'Active', value: warrantyBuckets.active },
              { key: 'expiring', label: 'Expiring Soon', value: warrantyBuckets.expiring },
              { key: 'expired', label: 'Expired', value: warrantyBuckets.expired },
              { key: 'none', label: 'No Warranty', value: warrantyBuckets.none },
            ] as const
          ).map((tile) => {
            const meta = getWarrantyDisplayMeta(tile.key);
            return (
              <div
                key={tile.key}
                className="rounded-xl border border-gray-100 bg-gray-50/40 p-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('h-2 w-2 rounded-full', meta.dotClass)} />
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    {tile.label}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{tile.value}</div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} className="text-amber-500" />
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Expiring within 30 days
            </h3>
          </div>
          {expiringList.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-2">
              No warranties expiring soon.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {expiringList.map((entry) => (
                <li key={entry.asset.id}>
                  <Link
                    to="/list/$assetId"
                    params={{ assetId: entry.asset.id }}
                    className="flex items-center justify-between py-2.5 px-1 group hover:bg-amber-50/40 rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {entry.asset.namespace}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
                      <span className="font-mono">
                        {formatWarrantyDate(entry.view.endDate)}
                      </span>
                      <ArrowRight
                        size={12}
                        className="text-gray-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all"
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
      )}

      {/* Automation Rules + Notifications + Discovery */}
      {(isEnabled('RULES_ENGINE') || isEnabled('AUTO_DISCOVERY')) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-12">
          {isEnabled('RULES_ENGINE') && <RulesWidget />}
          {isEnabled('RULES_ENGINE') && <NotificationFeed />}
          {isEnabled('AUTO_DISCOVERY') && <DiscoveryWidget />}
        </div>
      )}

      <div className="mb-12">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Quick Access</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickAccessCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + (index * 0.05) }}
            >
              <Link
                to={card.href as any}
                className={`block group h-full bg-white rounded-2xl p-5 border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md ${card.borderColor}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-200 ${card.bgColor}`}>
                  <card.icon size={20} className={card.color} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center justify-between">
                  {card.title}
                  <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-900 transition-colors group-hover:translate-x-1 duration-200" />
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {card.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Developer Tools */}
      {isEnabled('SETTINGS_PAGE') && (
        <div className="mb-12">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Developer Tools</h2>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <ExportImportPanel />
          </div>
        </div>
      )}
    </main>
  );
}
