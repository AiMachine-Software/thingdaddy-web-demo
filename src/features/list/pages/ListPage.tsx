import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PackageOpen, Plus, Search, X, Building2, Tag, Calendar, Trash2, Check, Shield, ArrowUpDown, Cloud } from 'lucide-react';
import { Button } from '#/components/ui/button';
import { Link } from '@tanstack/react-router';
import { cn } from '#/lib/utils';
import { mockDb, type Asset, type AssetStatus } from '#/lib/mockDb';
import { getCurrentOrgId } from '#/lib/tenant';
import {
  computeWarranty,
  getWarrantyDisplayMeta,
  formatWarrantyDate,
  type WarrantyStatus,
  type WarrantyView,
} from '#/lib/warranty';
import {
  getConnectionsForOrg,
  type CloudConnection,
  type CloudPlatform,
} from '#/lib/cloudConnections';
import CloudBadge from '#/features/cloud/components/CloudBadge';
import BulkConnectModal from '#/features/cloud/components/BulkConnectModal';
import { isEnabled } from '#/lib/feature-flags';

const STATUS_OPTIONS: { value: AssetStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'retired', label: 'Retired' },
];

const TYPE_OPTIONS = [
    { value: 'all', label: 'All Types' },
    { value: 'consumable', label: 'Consumable' },
    { value: 'wip', label: 'Work in Progress' },
    { value: 'fixed', label: 'Fixed Asset' },
    { value: 'human', label: 'Human Resource' },
];

const WARRANTY_OPTIONS: { value: WarrantyStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All Warranty' },
    { value: 'active', label: 'Active' },
    { value: 'expiring', label: 'Expiring Soon' },
    { value: 'expired', label: 'Expired' },
    { value: 'none', label: 'No Warranty' },
];

type SortByExpiry = 'none' | 'asc' | 'desc';

const STATUS_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    suspended: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    retired: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
};

export default function ListPage() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [warrantyFilter, setWarrantyFilter] = useState<WarrantyStatus | 'all'>('all');
    const [sortByExpiry, setSortByExpiry] = useState<SortByExpiry>('none');
    const [assets, setAssets] = useState<Asset[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({ message: '', isVisible: false });
    const [connections, setConnections] = useState<CloudConnection[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkOpen, setBulkOpen] = useState(false);

    const orgId = getCurrentOrgId();
    const currentOrg = orgId ? mockDb.getOrgById(orgId) : undefined;
    const warrantyEnabled = isEnabled('WARRANTY_MANAGEMENT');
    const cloudEnabled = isEnabled('CLOUD_CONNECTOR');

    const reloadConnections = () => {
        if (orgId) setConnections(getConnectionsForOrg(orgId));
    };

    useEffect(() => {
        setAssets(mockDb.getAssets(orgId || undefined));
        reloadConnections();
    }, [orgId]);

    const cloudsByThing = useMemo(() => {
        const map = new Map<string, CloudPlatform[]>();
        for (const c of connections) {
            const arr = map.get(c.thingId) ?? [];
            if (!arr.includes(c.platform)) arr.push(c.platform);
            map.set(c.thingId, arr);
        }
        return map;
    }, [connections]);

    const toggleSelected = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const clearSelection = () => setSelectedIds(new Set());

    const showToast = (message: string) => {
        setToast({ message, isVisible: true });
        setTimeout(() => setToast({ message: '', isVisible: false }), 2000);
    };

    const handleDelete = (id: string) => {
        mockDb.deleteAsset(id);
        setAssets(mockDb.getAssets(orgId || undefined));
        setDeleteConfirm(null);
        showToast('Asset deleted successfully');
    };

    const decoratedAssets: { asset: Asset; view: WarrantyView }[] = assets
        .map((asset) => ({ asset, view: computeWarranty(asset) }))
        .filter(({ asset, view }) => {
            const matchesSearch = !searchQuery ||
                asset.urn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                asset.namespace.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (asset.description && asset.description.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus = statusFilter === 'all' || (asset.status || 'active') === statusFilter;
            const matchesType = typeFilter === 'all' || asset.type === typeFilter;
            const matchesWarranty = warrantyFilter === 'all' || view.status === warrantyFilter;
            return matchesSearch && matchesStatus && matchesType && matchesWarranty;
        });

    if (sortByExpiry !== 'none') {
        decoratedAssets.sort((a, b) => {
            const aTime = a.view.endDate ? new Date(a.view.endDate).getTime() : Number.POSITIVE_INFINITY;
            const bTime = b.view.endDate ? new Date(b.view.endDate).getTime() : Number.POSITIVE_INFINITY;
            return sortByExpiry === 'asc' ? aTime - bTime : bTime - aTime;
        });
    }

    const filteredAssets = decoratedAssets.map((d) => d.asset);

    const cycleSortByExpiry = () => {
        setSortByExpiry((prev) =>
            prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none',
        );
    };

    return (
        <main className="min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Asset List
                    </h1>
                    <p className="text-gray-500 mt-2">
                        {currentOrg
                          ? `Showing things for ${currentOrg.name} (${currentOrg.companyPrefix})`
                          : 'Manage and view all your registered physical and digital assets.'}
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto h-11">
                    <AnimatePresence mode="wait">
                        {!isSearchOpen ? (
                            <motion.div
                                key="search-btn"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <Button
                                    onClick={() => setIsSearchOpen(true)}
                                    variant="outline"
                                    className="w-full sm:w-auto h-11 px-4 rounded-xl border-gray-200"
                                >
                                    <Search className="mr-2 h-4 w-4" />
                                    Search
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="search-input"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 250 }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.2 }}
                                className="relative overflow-hidden flex items-center h-11"
                            >
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                    <Search className="h-4 w-4" />
                                </div>
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Search assets..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full h-full pl-10 pr-10 py-2 border border-blue-500 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
                                />
                                <button
                                    onClick={() => {
                                        setIsSearchOpen(false);
                                        setSearchQuery("");
                                    }}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Button asChild className="flex-1 sm:flex-none h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20">
                        <Link to="/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Register Thing
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
                {STATUS_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setStatusFilter(opt.value)}
                        className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                            statusFilter === opt.value
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
                        )}
                    >
                        {opt.label}
                    </button>
                ))}
                <div className="w-px h-6 bg-gray-200 self-center mx-1" />
                {TYPE_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setTypeFilter(opt.value)}
                        className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                            typeFilter === opt.value
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
                        )}
                    >
                        {opt.label}
                    </button>
                ))}
                {warrantyEnabled && (
                    <>
                        <div className="w-px h-6 bg-gray-200 self-center mx-1" />
                        {WARRANTY_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setWarrantyFilter(opt.value)}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors inline-flex items-center gap-1.5',
                                    warrantyFilter === opt.value
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
                                )}
                            >
                                {opt.value === 'all' && <Shield size={12} />}
                                {opt.label}
                            </button>
                        ))}
                        <button
                            onClick={cycleSortByExpiry}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors inline-flex items-center gap-1.5',
                                sortByExpiry !== 'none'
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
                            )}
                            title="Sort by warranty expiry"
                        >
                            <ArrowUpDown size={12} />
                            {sortByExpiry === 'none'
                                ? 'Sort by Expiry'
                                : sortByExpiry === 'asc'
                                    ? 'Expiry ↑'
                                    : 'Expiry ↓'}
                        </button>
                    </>
                )}
            </div>

            {cloudEnabled && selectedIds.size > 0 && (
                <div className="sticky top-16 z-20 mb-4 flex items-center gap-3 bg-indigo-600 text-white rounded-2xl px-4 py-3 shadow-lg shadow-indigo-500/20">
                    <span className="text-sm font-semibold">
                        {selectedIds.size} selected
                    </span>
                    <Button
                        size="sm"
                        onClick={() => setBulkOpen(true)}
                        className="bg-white text-indigo-700 hover:bg-indigo-50 gap-1.5 h-8"
                    >
                        <Cloud className="h-3.5 w-3.5" />
                        Connect to Cloud
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearSelection}
                        className="text-white hover:bg-indigo-500 h-8"
                    >
                        Clear
                    </Button>
                </div>
            )}

            {assets.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full bg-white border border-gray-100 rounded-[2rem] shadow-sm p-12 flex flex-col items-center justify-center min-h-[400px] text-center"
                >
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-400">
                        <PackageOpen strokeWidth={1.5} size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No things registered yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                        Your organization hasn't registered any things yet. Register your first thing to get started.
                    </p>
                    <Button asChild className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Link to="/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Create First Asset
                        </Link>
                    </Button>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {decoratedAssets.map(({ asset, view }, idx) => {
                            const org = mockDb.getOrgById(asset.orgId);
                            const status = asset.status || 'active';
                            const badge = STATUS_BADGE[status];
                            const warrantyMeta = getWarrantyDisplayMeta(view.status);
                            const thingClouds = cloudsByThing.get(asset.id) ?? [];
                            const isSelected = selectedIds.has(asset.id);
                            return (
                                <motion.div
                                    key={asset.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={cn(
                                        'bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative group flex flex-col h-full',
                                        isSelected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200',
                                    )}
                                >
                                    {cloudEnabled && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSelected(asset.id);
                                            }}
                                            aria-label={isSelected ? 'Deselect thing' : 'Select thing'}
                                            className={cn(
                                                'absolute top-3 left-3 h-5 w-5 rounded-md border flex items-center justify-center transition-all z-10',
                                                isSelected
                                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                                    : 'bg-white border-gray-300 hover:border-indigo-400 opacity-0 group-hover:opacity-100',
                                            )}
                                        >
                                            {isSelected && <Check size={12} strokeWidth={3} />}
                                        </button>
                                    )}
                                    <div className={cn('flex justify-between items-start mb-4', cloudEnabled && 'pl-6')}>
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100/80 text-gray-700 rounded-full text-xs font-semibold border border-gray-200/50">
                                            <Building2 size={12} className="text-gray-500" />
                                            {org?.name || asset.gs1CompanyPrefix || 'Unknown Org'}
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap justify-end">
                                            <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold', badge.bg, badge.text)}>
                                                <span className={cn('h-1.5 w-1.5 rounded-full', badge.dot)} />
                                                {status}
                                            </span>
                                            {warrantyEnabled && (
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                                                        warrantyMeta.badgeClass,
                                                    )}
                                                    title={`Warranty: ${warrantyMeta.label}`}
                                                >
                                                    <span className={cn('h-1.5 w-1.5 rounded-full', warrantyMeta.dotClass)} />
                                                    {warrantyMeta.label}
                                                </span>
                                            )}
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                {asset.type}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight truncate" title={asset.namespace}>
                                            {asset.namespace}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-2 text-xs font-mono text-blue-600 bg-blue-50/50 border border-blue-100/50 px-2.5 py-1.5 rounded-lg truncate w-max max-w-full">
                                            <Tag size={12} className="shrink-0 text-blue-400" />
                                            <span className="truncate">{asset.urn}</span>
                                        </div>
                                    </div>

                                    {cloudEnabled && thingClouds.length > 0 && (
                                        <div className="flex items-center gap-1 flex-wrap mb-3">
                                            <Cloud size={12} className="text-gray-400" />
                                            {thingClouds.map((p) => (
                                                <CloudBadge key={p} platform={p} size="xs" />
                                            ))}
                                        </div>
                                    )}

                                    {asset.description ? (
                                        <p className="text-sm text-gray-500 leading-relaxed mt-auto pt-4 border-t border-gray-50 line-clamp-2">
                                            {asset.description}
                                        </p>
                                    ) : (
                                        <div className="mt-auto pt-4 border-t border-gray-50" />
                                    )}

                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                                            <span className="inline-flex items-center gap-1.5">
                                                <Calendar size={12} />
                                                {new Date(asset.createdAt).toLocaleDateString()}
                                            </span>
                                            {warrantyEnabled && view.endDate && view.status !== 'none' && (
                                                <span className="inline-flex items-center gap-1.5" title="Warranty expires">
                                                    <Shield size={12} />
                                                    Expires {formatWarrantyDate(view.endDate)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {deleteConfirm === asset.id ? (
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        size="xs"
                                                        variant="destructive"
                                                        className="h-7 text-[10px] rounded-lg"
                                                        onClick={() => handleDelete(asset.id)}
                                                    >
                                                        Confirm
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        variant="ghost"
                                                        className="h-7 text-[10px] rounded-lg"
                                                        onClick={() => setDeleteConfirm(null)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    size="icon-xs"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-gray-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => setDeleteConfirm(asset.id)}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            )}
                                            <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-bold text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg pr-2">
                                               <Link to="/list/$assetId" params={{ assetId: asset.id }}>
                                                   View Detail
                                               </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {filteredAssets.length === 0 && assets.length > 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500 border border-dashed rounded-3xl">
                            No assets match your filters.
                        </div>
                    )}
                </div>
            )}

            {orgId && (
                <BulkConnectModal
                    open={bulkOpen}
                    onOpenChange={setBulkOpen}
                    selectedAssetIds={Array.from(selectedIds)}
                    orgId={orgId}
                    onApplied={(count) => {
                        reloadConnections();
                        clearSelection();
                        showToast(`Connected ${count} thing${count === 1 ? '' : 's'} to cloud`);
                    }}
                />
            )}

            {/* Toast */}
            <AnimatePresence>
                {toast.isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-6 right-6 bg-white text-gray-900 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 border border-gray-200"
                    >
                        <div className="bg-emerald-500 text-white rounded-full p-1">
                            <Check size={12} strokeWidth={3} />
                        </div>
                        <span className="text-sm font-medium">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
