import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Copy,
  ArrowDown,
  Check,
  ChevronLeft,
  Edit3,
  Save,
  Building2,
  Tag,
  Info,
  Trash2,
  Shield,
  ExternalLink,
  Link2,
  RotateCcw,
  Ban,
} from "lucide-react";
import { cn } from "#/lib/utils";
import { Input } from "#/components/ui/input";
import { Card } from "#/components/ui/card";
import { Button } from "#/components/ui/button";
import { Textarea } from "#/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { useNavigate, useParams } from "@tanstack/react-router";
import { mockDb, type Asset, type AssetStatus } from "#/lib/mockDb";
import { getCurrentOrgId } from "#/lib/tenant";
import { QRCodeDisplay } from "#/components/QRCodeDisplay";
import {
  computeWarranty,
  formatWarrantyDate,
  getWarrantyDisplayMeta,
} from "#/lib/warranty";
import CloudConnectionsCard from "#/features/cloud/components/CloudConnectionsCard";
import PairedDevicesCard from "#/features/discovery/components/PairedDevicesCard";
import IdentityCard from "#/features/economy/components/IdentityCard";
import WalletCard from "#/features/economy/components/WalletCard";
import CapabilityCard from "#/features/economy/components/CapabilityCard";
import { isEnabled } from "#/lib/feature-flags";

const STATUS_OPTIONS: { value: AssetStatus; label: string; color: string }[] = [
  { value: 'active', label: 'Active', color: 'bg-emerald-500' },
  { value: 'suspended', label: 'Suspended', color: 'bg-amber-500' },
  { value: 'retired', label: 'Retired', color: 'bg-gray-400' },
];

const AUDIT_ICONS: Record<string, string> = {
  created: 'bg-emerald-100 text-emerald-600',
  updated: 'bg-blue-100 text-blue-600',
  deleted: 'bg-red-100 text-red-600',
  status_changed: 'bg-amber-100 text-amber-600',
  transferred: 'bg-purple-100 text-purple-600',
  imported: 'bg-cyan-100 text-cyan-600',
};

function AuditHistorySection({ thingId }: { thingId: string }) {
  const logs = mockDb.getAuditLogs({ thingId });
  if (logs.length === 0) return <p className="text-sm text-gray-400">No history yet.</p>;
  return (
    <div className="space-y-3">
      {logs.slice(0, 10).map((log) => (
        <div key={log.id} className="flex items-start gap-3">
          <div className={cn('h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0', AUDIT_ICONS[log.action] || 'bg-gray-100 text-gray-500')}>
            {log.action.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-700 capitalize">{log.action.replace('_', ' ')}</p>
            <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
            {log.details && Object.keys(log.details).length > 0 && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {Object.entries(log.details).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`).join(', ')}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AssetDetailPage() {
  const { assetId } = useParams({ from: '/_auth/list_/$assetId' });
  const navigate = useNavigate();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Asset>>({});
  const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({ message: "", isVisible: false });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [warrantyForm, setWarrantyForm] = useState<{
    period: string;
    endDate: string;
    notes: string;
  }>({ period: 'none', endDate: '', notes: '' });

  const currentOrgId = getCurrentOrgId();

  useEffect(() => {
    const data = mockDb.getAsset(assetId);
    if (data) {
      if (currentOrgId && data.orgId !== currentOrgId) {
        setAccessDenied(true);
        return;
      }
      setAsset(data);
      setForm(data);
      // Seed warranty form from stored values, or fall back to derived defaults
      const view = computeWarranty(data);
      const periodKey = data.warrantyEndDate && data.warrantyPeriodMonths == null
        ? 'custom'
        : view.periodMonths != null
          ? String(view.periodMonths)
          : 'none';
      setWarrantyForm({
        period: periodKey,
        endDate: view.endDate ? view.endDate.slice(0, 10) : '',
        notes: data.warrantyNotes ?? '',
      });
    } else {
      navigate({ to: "/list" });
    }
  }, [assetId, navigate, currentOrgId]);

  const identifiers = useMemo(() => {
    if (form.elementString || form.epcUri || form.epcTagUri) {
      return {
        elementString: form.elementString || null,
        epcUri: form.epcUri || null,
        epcTagUri: form.epcTagUri || null,
        rfid: form.rfid || null,
      };
    }
    const fullUrn = form.urn || "";
    if (!fullUrn) return null;
    const encoded = btoa(fullUrn).substring(0, 16);
    const rfid = Array.from(encoded)
      .map(c => c.charCodeAt(0).toString(16))
      .join("")
      .toUpperCase()
      .substring(0, 24);
    return { elementString: null, epcUri: encoded, epcTagUri: null, rfid };
  }, [form.urn, form.elementString, form.epcUri, form.epcTagUri, form.rfid]);

  const handleInputChange = (field: keyof Asset, value: string) => {
    const updatedForm = { ...form, [field]: value };
    if (field === 'namespace') {
      const parts = (updatedForm.urn || "").split(":");
      if (parts.length >= 3) {
        parts[2] = value;
        updatedForm.urn = parts.join(":");
      }
    }
    setForm(updatedForm);
  };

  const handleSave = () => {
    if (form.id) {
      const { orgId: _orgId, ...updates } = form;
      mockDb.updateAsset(form.id, updates);
      setAsset({ ...form, orgId: asset!.orgId } as Asset);
      setIsEditing(false);
      showToast("Asset updated successfully");
    }
  };

  const handleStatusChange = (status: AssetStatus) => {
    if (!asset) return;
    mockDb.updateAssetStatus(asset.id, status);
    const updated = { ...asset, status };
    setAsset(updated);
    setForm(updated);
    showToast(`Status changed to ${status}`);
  };

  const handleDelete = () => {
    if (!asset) return;
    mockDb.deleteAsset(asset.id);
    navigate({ to: "/list" });
  };

  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
    setTimeout(() => setToast({ message: "", isVisible: false }), 2000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied!`);
  };

  const handleSaveWarranty = () => {
    if (!asset) return;
    let warrantyPeriodMonths: number | null = null;
    let warrantyEndDate: string | null = null;
    if (warrantyForm.period === 'custom') {
      warrantyEndDate = warrantyForm.endDate
        ? new Date(warrantyForm.endDate).toISOString()
        : null;
    } else if (warrantyForm.period !== 'none') {
      const months = Number(warrantyForm.period);
      if (!Number.isNaN(months) && months > 0) {
        warrantyPeriodMonths = months;
        const end = new Date(asset.createdAt);
        end.setMonth(end.getMonth() + months);
        warrantyEndDate = end.toISOString();
      }
    }
    mockDb.updateAsset(asset.id, {
      warrantyPeriodMonths,
      warrantyEndDate,
      warrantyNotes: warrantyForm.notes || undefined,
    });
    const refreshed = mockDb.getAsset(asset.id);
    if (refreshed) {
      setAsset(refreshed);
      setForm(refreshed);
    }
    showToast('Warranty saved');
  };

  const handleVoidWarranty = () => {
    if (!asset) return;
    mockDb.updateAsset(asset.id, { warrantyVoid: true });
    const refreshed = mockDb.getAsset(asset.id);
    if (refreshed) {
      setAsset(refreshed);
      setForm(refreshed);
    }
    showToast('Warranty voided');
  };

  const handleReactivateWarranty = () => {
    if (!asset) return;
    mockDb.updateAsset(asset.id, { warrantyVoid: false });
    const refreshed = mockDb.getAsset(asset.id);
    if (refreshed) {
      setAsset(refreshed);
      setForm(refreshed);
    }
    showToast('Warranty reactivated');
  };

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="w-full max-w-3xl mx-auto text-center py-20">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Info size={32} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-6">This thing belongs to another organization.</p>
          <Button onClick={() => navigate({ to: "/list" })} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
            Back to Things List
          </Button>
        </div>
      </div>
    );
  }

  if (!asset) return null;

  const currentStatus = asset.status || 'active';

  return (
    <div className="min-h-screen bg-[#FDFDFD] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate({ to: "/list" })}
            className="group flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to List
          </button>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="ghost"
                  className="rounded-xl h-10 px-3 text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </Button>
                <Button
                  onClick={() => setIsEditing(true)}
                  className="rounded-xl bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 h-10 px-4 flex items-center gap-2 shadow-sm"
                >
                  <Edit3 size={16} />
                  Edit Asset
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setForm(asset);
                  }}
                  variant="ghost"
                  className="rounded-xl h-10 px-4 text-gray-500"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-4 flex items-center gap-2"
                >
                  <Save size={16} />
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>

        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-full border border-indigo-100 uppercase tracking-widest">
              <Tag size={12} />
              Asset Details
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            {isEditing ? "Edit Asset" : asset.namespace}
          </h1>
          <p className="mt-3 text-lg text-gray-500 font-medium">
            Review and manage asset information and RFID configurations.
          </p>
        </header>

        <div className="space-y-8">
          {/* Status Bar */}
          <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-sm font-bold text-gray-700">Status:</span>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                    currentStatus === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300',
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full', opt.color)} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Card className="p-8 shadow-sm border-gray-100 rounded-2xl space-y-8">
             {/* Company (read-only — changing org requires a transfer) */}
             <div className="space-y-1 relative z-40">
              <label className="text-sm font-bold text-gray-700">Associated Company</label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <Building2 size={16} className="text-gray-400" />
                <span className="text-gray-700 font-medium">
                  {mockDb.getOrgById(asset.orgId)?.name || asset.gs1CompanyPrefix || "N/A"}
                </span>
              </div>
              {isEditing && (
                <p className="text-xs text-muted-foreground mt-1">Organization cannot be changed. Use Transfers to move this thing.</p>
              )}
            </div>

            {/* Namespace & Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Namespace</label>
                {isEditing ? (
                  <Input
                    value={form.namespace}
                    onChange={(e) => handleInputChange('namespace', e.target.value)}
                    className="h-11"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 font-medium h-11 flex items-center">
                    {asset.namespace}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Asset Type</label>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 font-medium h-11 flex items-center capitalize">
                  {asset.type}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Description</label>
              {isEditing ? (
                <Textarea
                  value={form.description || ""}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter asset description..."
                  className="min-h-[100px] rounded-xl"
                />
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-600 text-sm leading-relaxed min-h-[100px]">
                  {asset.description || <span className="text-gray-400 italic">No description provided.</span>}
                </div>
              )}
            </div>

            {/* Identifiers */}
            <div className="space-y-6 pt-6 border-t border-gray-100">
               <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">ThingDaddy URN</span>
                    <button onClick={() => copyToClipboard(form.urn || "", "URN")} className="text-gray-400 hover:text-indigo-600 transition-colors">
                      <Copy size={14} />
                    </button>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl font-mono text-sm overflow-x-auto text-indigo-700">
                    {form.urn}
                  </div>
               </div>

               {identifiers?.elementString && (
                 <>
                   <div className="flex justify-center py-2">
                     <div className="w-8 h-8 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-300">
                       <ArrowDown size={16} />
                     </div>
                   </div>
                   <div>
                     <div className="flex items-center justify-between mb-3">
                       <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">GS1 Element String</span>
                       <button onClick={() => copyToClipboard(identifiers.elementString!, "Element String")} className="text-gray-400 hover:text-amber-500 transition-colors">
                         <Copy size={14} />
                       </button>
                     </div>
                     <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl font-mono text-sm overflow-x-auto text-amber-700">
                       {identifiers.elementString}
                     </div>
                   </div>
                 </>
               )}

               {identifiers?.epcUri && (
                 <>
                   <div className="flex justify-center py-2">
                     <div className="w-8 h-8 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-300">
                       <ArrowDown size={16} />
                     </div>
                   </div>
                   <div>
                     <div className="flex items-center justify-between mb-3">
                       <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">EPC Pure Identity URI</span>
                       <button onClick={() => copyToClipboard(identifiers.epcUri!, "EPC URI")} className="text-gray-400 hover:text-blue-500 transition-colors">
                         <Copy size={14} />
                       </button>
                     </div>
                     <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl font-mono text-sm overflow-x-auto text-blue-700">
                       {identifiers.epcUri}
                     </div>
                   </div>
                 </>
               )}

               {identifiers?.epcTagUri && (
                 <>
                   <div className="flex justify-center py-2">
                     <div className="w-8 h-8 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-300">
                       <ArrowDown size={16} />
                     </div>
                   </div>
                   <div>
                     <div className="flex items-center justify-between mb-3">
                       <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">EPC Tag URI</span>
                       <button onClick={() => copyToClipboard(identifiers.epcTagUri!, "EPC Tag URI")} className="text-gray-400 hover:text-cyan-500 transition-colors">
                         <Copy size={14} />
                       </button>
                     </div>
                     <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl font-mono text-sm overflow-x-auto text-cyan-700">
                       {identifiers.epcTagUri}
                     </div>
                   </div>
                 </>
               )}

               {identifiers?.rfid && (
                 <>
                   <div className="flex justify-center py-2">
                     <div className="w-8 h-8 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-300">
                       <ArrowDown size={16} />
                     </div>
                   </div>
                   <div>
                     <div className="flex items-center justify-between mb-3">
                       <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">RFID Tag EPC (Hex)</span>
                       <button onClick={() => copyToClipboard(identifiers.rfid!, "RFID")} className="text-gray-400 hover:text-emerald-500 transition-colors">
                         <Copy size={14} />
                       </button>
                     </div>
                     <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl font-mono text-sm overflow-x-auto text-emerald-700">
                       {identifiers.rfid}
                     </div>
                   </div>
                 </>
               )}
               {/* Digital Link URI */}
               {form.digitalLinkUri && (
                 <>
                   <div className="flex justify-center py-2">
                     <div className="w-8 h-8 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-300">
                       <ArrowDown size={16} />
                     </div>
                   </div>
                   <div>
                     <div className="flex items-center justify-between mb-3">
                       <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">GS1 Digital Link URI</span>
                       <button onClick={() => copyToClipboard(form.digitalLinkUri!, "Digital Link")} className="text-gray-400 hover:text-violet-500 transition-colors">
                         <Copy size={14} />
                       </button>
                     </div>
                     <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl font-mono text-sm overflow-x-auto text-violet-700">
                       {form.digitalLinkUri}
                     </div>
                   </div>
                 </>
               )}

               {/* QR Code */}
               {form.digitalLinkUri && (
                 <div className="pt-4">
                   <div className="bg-white rounded-2xl border border-gray-100 p-6 flex justify-center">
                     <QRCodeDisplay value={form.digitalLinkUri} size={180} label="GS1 Digital Link" />
                   </div>
                 </div>
               )}
            </div>
          </Card>

          <div className="flex items-start gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
            <Info size={18} className="text-indigo-500 mt-0.5 shrink-0" />
            <p className="text-xs text-indigo-700 leading-relaxed">
              Standardized URN and RFID identifiers are generated based on the asset metadata. Changes to the namespace will automatically regenerate the unique identifiers.
            </p>
          </div>
          {/* Warranty Settings */}
          {isEnabled('WARRANTY_MANAGEMENT') && (() => {
            const view = computeWarranty(asset);
            const meta = getWarrantyDisplayMeta(view.status);
            const isCustom = warrantyForm.period === 'custom';
            const isVoid = !!asset.warrantyVoid;
            const computedEnd =
              !isCustom && warrantyForm.period !== 'none'
                ? (() => {
                    const months = Number(warrantyForm.period);
                    if (Number.isNaN(months) || months <= 0) return null;
                    const d = new Date(asset.createdAt);
                    d.setMonth(d.getMonth() + months);
                    return d.toISOString();
                  })()
                : null;
            const publicUrl =
              typeof window !== 'undefined'
                ? `${window.location.origin}/thing/${asset.id}`
                : `/thing/${asset.id}`;
            return (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Warranty Settings</h3>
                    <p className="text-xs text-gray-500">
                      Manage warranty period, expiry, and notes for this Thing.
                    </p>
                  </div>
                  <span
                    className={cn(
                      'ml-auto inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border',
                      meta.badgeClass,
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full mr-1.5', meta.dotClass)} />
                    {meta.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Warranty Period
                    </label>
                    <Select
                      value={warrantyForm.period}
                      onValueChange={(v) =>
                        setWarrantyForm((prev) => ({ ...prev, period: v }))
                      }
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="6">6 months</SelectItem>
                        <SelectItem value="12">12 months</SelectItem>
                        <SelectItem value="24">24 months</SelectItem>
                        <SelectItem value="36">36 months</SelectItem>
                        <SelectItem value="custom">Custom date…</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Start Date
                    </label>
                    <div className="rounded-lg py-2 px-3 bg-gray-50 ring-1 ring-inset ring-gray-200 text-sm font-mono text-gray-700 h-10 flex items-center">
                      {formatWarrantyDate(asset.createdAt)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      End Date {isCustom ? '(custom)' : '(computed)'}
                    </label>
                    {isCustom ? (
                      <input
                        type="date"
                        value={warrantyForm.endDate}
                        onChange={(e) =>
                          setWarrantyForm((prev) => ({ ...prev, endDate: e.target.value }))
                        }
                        className="block w-full h-10 rounded-lg border-0 py-2 px-3 text-sm shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <div className="rounded-lg py-2 px-3 bg-gray-50 ring-1 ring-inset ring-gray-200 text-sm font-mono text-gray-700 h-10 flex items-center">
                        {formatWarrantyDate(computedEnd)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Warranty Notes
                  </label>
                  <Textarea
                    rows={3}
                    value={warrantyForm.notes}
                    onChange={(e) =>
                      setWarrantyForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="e.g. Standard manufacturer warranty for sensor/consumable goods."
                    className="rounded-lg"
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button onClick={handleSaveWarranty} className="gap-1.5">
                    <Save className="w-3.5 h-3.5" />
                    Save Warranty
                  </Button>
                  {isVoid ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReactivateWarranty}
                      className="gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reactivate Warranty
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleVoidWarranty}
                      className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Void Warranty
                    </Button>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-2">
                    Public warranty page
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="flex-1 min-w-0 truncate font-mono text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-indigo-700">
                      <Link2 className="w-3 h-3 inline mr-1" />
                      /thing/{asset.id}
                    </code>
                    <Button asChild variant="outline" size="sm" className="gap-1.5">
                      <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open
                      </a>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(publicUrl, 'Warranty link')}
                      className="gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy Link
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Cloud Connections */}
          {isEnabled('CLOUD_CONNECTOR') && (
            <CloudConnectionsCard thingId={asset.id} orgId={asset.orgId} />
          )}

          {/* Paired Devices (Discovery) */}
          {isEnabled('AUTO_DISCOVERY') && (
            <PairedDevicesCard thingId={asset.id} />
          )}

          {/* Machine Economy — Identity, Wallet, Capabilities */}
          {isEnabled('DEVICE_IDENTITY') && <IdentityCard thingId={asset.id} />}
          {isEnabled('DEVICE_IDENTITY') && <WalletCard thingId={asset.id} />}
          {isEnabled('DEVICE_IDENTITY') && <CapabilityCard thingId={asset.id} />}

          {/* Device metadata (auto-discovered) */}
          {asset.deviceMetadata && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-700 mb-4">Device Metadata</h3>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {asset.deviceMetadata.macAddress && (
                  <div>
                    <dt className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">MAC</dt>
                    <dd className="text-gray-900 font-mono">{asset.deviceMetadata.macAddress}</dd>
                  </div>
                )}
                {asset.deviceMetadata.ipAddress && (
                  <div>
                    <dt className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">IP</dt>
                    <dd className="text-gray-900 font-mono">{asset.deviceMetadata.ipAddress}</dd>
                  </div>
                )}
                {asset.deviceMetadata.manufacturer && (
                  <div>
                    <dt className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Manufacturer</dt>
                    <dd className="text-gray-900">{asset.deviceMetadata.manufacturer}</dd>
                  </div>
                )}
                {asset.deviceMetadata.model && (
                  <div>
                    <dt className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Model</dt>
                    <dd className="text-gray-900">{asset.deviceMetadata.model}</dd>
                  </div>
                )}
                {asset.deviceMetadata.firmware && (
                  <div>
                    <dt className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Firmware</dt>
                    <dd className="text-gray-900">{asset.deviceMetadata.firmware}</dd>
                  </div>
                )}
                {asset.deviceMetadata.protocol && (
                  <div>
                    <dt className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Protocol</dt>
                    <dd className="text-gray-900 uppercase">{asset.deviceMetadata.protocol}</dd>
                  </div>
                )}
                {asset.deviceMetadata.signalStrength != null && (
                  <div>
                    <dt className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Signal</dt>
                    <dd className="text-gray-900">{asset.deviceMetadata.signalStrength} dBm</dd>
                  </div>
                )}
                {asset.deviceMetadata.autoRegistered && (
                  <div>
                    <dt className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Source</dt>
                    <dd className="text-teal-700 font-semibold">Auto-discovered</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Audit History */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4">History</h3>
            <AuditHistorySection thingId={assetId} />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4 border border-gray-100"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Asset</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete <strong>{asset.namespace}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-xl"
                  onClick={handleDelete}
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
    </div>
  );
}
