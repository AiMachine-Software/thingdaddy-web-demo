import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearch, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { PlaceholdersAndVanishInput } from "#/components/ui/placeholders-and-vanish-input";
import { mockDb, type Asset } from "#/lib/mockDb";
import { getCurrentOrgId } from "#/lib/tenant";
import { Building2, Tag, Calendar, PackageOpen, Search, Cpu, Copy, Check } from "lucide-react";
import { Button } from "#/components/ui/button";
import { decodeEpcHex, type DecodedEpc } from "#/lib/gs1";

function isHexString(s: string): boolean {
  return /^[0-9A-Fa-f]{24,}$/.test(s.replace(/\s/g, ''))
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="text-gray-400 hover:text-emerald-500 transition-colors"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  )
}

function DecodedEpcCard({ decoded, matchedAsset }: { decoded: DecodedEpc; matchedAsset?: Asset }) {
  const rows = [
    { label: 'Scheme', value: decoded.scheme.toUpperCase() },
    { label: 'Filter', value: String(decoded.filter) },
    { label: 'Partition', value: String(decoded.partition) },
    { label: 'Company Prefix', value: decoded.companyPrefix },
    ...(decoded.indicatorAndItemRef ? [{ label: 'Indicator + Item Ref', value: decoded.indicatorAndItemRef }] : []),
    ...(decoded.serial ? [{ label: 'Serial', value: decoded.serial }] : []),
    ...(decoded.assetRef ? [{ label: 'Asset Reference', value: decoded.assetRef }] : []),
    ...(decoded.serviceRef ? [{ label: 'Service Reference', value: decoded.serviceRef }] : []),
    ...(decoded.partRef ? [{ label: 'Part Reference', value: decoded.partRef }] : []),
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
          <Cpu className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Decoded EPC</h3>
          <p className="text-xs text-gray-500">{decoded.scheme.toUpperCase()} encoding</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {rows.map((r) => (
          <div key={r.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{r.label}</p>
            <p className="text-sm font-mono text-gray-900 mt-0.5 break-all">{r.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {[
          { label: 'EPC Pure Identity URI', value: decoded.epcPureIdentityUri },
          { label: 'EPC Tag URI', value: decoded.epcTagUri },
          { label: 'GS1 Element String', value: decoded.gs1ElementString },
        ].map((row) => (
          <div key={row.label} className="rounded-xl bg-gray-50 border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-400">{row.label}</p>
              <CopyBtn text={row.value} />
            </div>
            <p className="font-mono text-xs text-emerald-700 mt-1 break-all">{row.value}</p>
          </div>
        ))}
      </div>

      {matchedAsset && (
        <div className="border-t pt-4">
          <p className="text-xs text-gray-500 mb-2">Matched registered thing:</p>
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link to="/list/$assetId" params={{ assetId: matchedAsset.id }}>
              View {matchedAsset.namespace} — {matchedAsset.type}
            </Link>
          </Button>
        </div>
      )}
    </motion.div>
  )
}

export default function SearchAssetPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  const queryFromUrl = (search as any)?.q || "";
  const [query, setQuery] = useState(queryFromUrl);
  const [assets, setAssets] = useState<Asset[]>([]);
  const currentOrgId = getCurrentOrgId();

  useEffect(() => {
    setAssets(mockDb.getAssets());
  }, []);

  const isHex = isHexString(queryFromUrl)

  const decodedEpc = useMemo(() => {
    if (!isHex) return null
    try {
      return decodeEpcHex(queryFromUrl.replace(/\s/g, ''))
    } catch {
      return null
    }
  }, [queryFromUrl, isHex])

  const matchedAsset = useMemo(() => {
    if (!decodedEpc) return undefined
    return assets.find(
      (a) => a.rfid === queryFromUrl.replace(/\s/g, '').toUpperCase() ||
        a.epcUri === decodedEpc.epcPureIdentityUri ||
        a.epcTagUri === decodedEpc.epcTagUri
    )
  }, [decodedEpc, assets, queryFromUrl])

  const filteredAssets = queryFromUrl && !isHex ? assets.filter(asset =>
    asset.urn.toLowerCase().includes(queryFromUrl.toLowerCase()) ||
    asset.namespace.toLowerCase().includes(queryFromUrl.toLowerCase()) ||
    asset.rfid.toLowerCase().includes(queryFromUrl.toLowerCase()) ||
    (asset.epcUri && asset.epcUri.toLowerCase().includes(queryFromUrl.toLowerCase())) ||
    (asset.description && asset.description.toLowerCase().includes(queryFromUrl.toLowerCase()))
  ) : [];

  const placeholders = [
    "Search by ThingDaddy ID...",
    "Paste EPC hex to decode...",
    "Scan or type RFID/URN...",
    "Search by assigned user...",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      setTimeout(() => {
        navigate({ to: '/search-assets', search: { q: query.trim() } as any });
      }, 400);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] py-12 flex flex-col items-center max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
      <div className="w-full mb-12">
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center space-y-4"
        >
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                Resolver
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto pb-4">
                Resolve any identifier — ThingDaddy URN, EPC URI, RFID hex, or keywords.
            </p>
            <div className="w-full max-w-3xl">
                <PlaceholdersAndVanishInput
                    placeholders={placeholders}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    defaultValue={queryFromUrl}
                />
            </div>
        </motion.div>
      </div>

      <div className="w-full">
        {/* Hex decode result */}
        {isHex && decodedEpc && (
          <div className="mb-8">
            <DecodedEpcCard decoded={decodedEpc} matchedAsset={matchedAsset} />
          </div>
        )}

        {isHex && !decodedEpc && queryFromUrl && (
          <div className="mb-8 text-center p-8 bg-red-50 border border-red-200 rounded-3xl">
            <p className="text-red-700 font-medium">Could not decode hex string</p>
            <p className="text-sm text-red-500 mt-1">The hex does not match any known EPC encoding header.</p>
          </div>
        )}

        {/* Regular search results */}
        {!isHex && (
          <>
            <div className="mb-6 text-left border-b pb-4">
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold text-gray-900"
              >
                {queryFromUrl ? (
                  <>Results for <span className="text-blue-600">"{queryFromUrl}"</span></>
                ) : (
                  "Recent Assets"
                )}
              </motion.h2>
            </div>

            <div className="w-full text-left">
              {!queryFromUrl ? (
                <div className="text-gray-500 bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-300">
                        <Search strokeWidth={1.5} size={32} />
                    </div>
                    <p className="text-lg font-medium text-gray-900">Ready to resolve</p>
                    <p className="text-sm mt-1">Enter a ThingDaddy URN, RFID hex, or GS1 identifier above.</p>
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="text-gray-500 bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-300">
                        <PackageOpen strokeWidth={1.5} size={32} />
                    </div>
                    <p className="text-lg font-medium text-gray-900">No assets found</p>
                    <p className="text-sm mt-1 text-gray-400">"{queryFromUrl}" did not match any registered identifiers.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredAssets.map((asset, idx) => {
                            const org = mockDb.getOrgById(asset.orgId);
                            const isOwner = currentOrgId === asset.orgId;
                            return (
                                <motion.div
                                    key={asset.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col h-full"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100/80 text-gray-700 rounded-full text-xs font-semibold border border-gray-200/50">
                                            <Building2 size={12} className="text-gray-500" />
                                            {org?.name || asset.gs1CompanyPrefix || 'Unknown'}
                                            {isOwner && <span className="text-emerald-600 ml-1">(You)</span>}
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                            {asset.type}
                                        </span>
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

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                                            <Calendar size={12} />
                                            {new Date(asset.createdAt).toLocaleDateString()}
                                        </div>
                                        {isOwner ? (
                                          <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-bold text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg pr-2">
                                              <Link to="/list/$assetId" params={{ assetId: asset.id }}>
                                                  View Detail
                                              </Link>
                                          </Button>
                                        ) : (
                                          <span className="text-[10px] text-gray-400">Other organization</span>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
