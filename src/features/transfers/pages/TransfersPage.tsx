import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowRightLeft, Check, X, Send, Building2 } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Textarea } from '#/components/ui/textarea'
import { cn } from '#/lib/utils'
import { mockDb, type Transfer, type Asset, type Organization } from '#/lib/mockDb'
import { getCurrentOrgId } from '#/lib/tenant'

type TabId = 'initiate' | 'pending' | 'history'

export default function TransfersPage() {
  const [tab, setTab] = useState<TabId>('initiate')
  const [assets, setAssets] = useState<Asset[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [selectedThings, setSelectedThings] = useState<Set<string>>(new Set())
  const [destOrgId, setDestOrgId] = useState('')
  const [note, setNote] = useState('')
  const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({ message: '', isVisible: false })

  const orgId = getCurrentOrgId()

  const refresh = () => {
    setAssets(mockDb.getAssets(orgId || undefined))
    setOrgs(mockDb.getAllOrgs())
    setTransfers(mockDb.getTransfers({ orgId: orgId || undefined }))
  }

  useEffect(() => { refresh() }, [orgId])

  const showToast = (msg: string) => {
    setToast({ message: msg, isVisible: true })
    setTimeout(() => setToast({ message: '', isVisible: false }), 2500)
  }

  const handleInitiate = () => {
    if (selectedThings.size === 0 || !destOrgId) return
    for (const thingId of selectedThings) {
      const asset = assets.find(a => a.id === thingId)
      if (asset) {
        mockDb.createTransfer({ thingId, fromOrgId: asset.orgId, toOrgId: destOrgId, note: note || undefined })
      }
    }
    showToast(`Initiated ${selectedThings.size} transfer(s)`)
    setSelectedThings(new Set())
    setDestOrgId('')
    setNote('')
    refresh()
    setTab('pending')
  }

  const handleAccept = (id: string) => {
    mockDb.acceptTransfer(id)
    showToast('Transfer accepted')
    refresh()
  }

  const handleReject = (id: string) => {
    mockDb.rejectTransfer(id)
    showToast('Transfer rejected')
    refresh()
  }

  const pendingTransfers = transfers.filter(t => t.status === 'pending')
  const historyTransfers = transfers.filter(t => t.status !== 'pending')

  const toggleThing = (id: string) => {
    setSelectedThings(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'initiate', label: 'Initiate Transfer' },
    { id: 'pending', label: 'Pending', count: pendingTransfers.length },
    { id: 'history', label: 'History' },
  ]

  return (
    <main className="min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Transfers</h1>
        <p className="text-gray-500 mt-2">Transfer ownership of things between organizations.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              tab === t.id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
            )}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="ml-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Initiate Tab */}
      {tab === 'initiate' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3">Select Things to Transfer</h3>
            <div className="grid gap-2 max-h-[300px] overflow-y-auto border rounded-xl p-3">
              {assets.filter(a => (a.status || 'active') === 'active').map(a => {
                const org = mockDb.getOrgById(a.orgId)
                return (
                  <label key={a.id} className={cn(
                    'flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors',
                    selectedThings.has(a.id) ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50 border border-transparent'
                  )}>
                    <input type="checkbox" checked={selectedThings.has(a.id)} onChange={() => toggleThing(a.id)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.namespace}</p>
                      <p className="text-xs text-gray-500">{org?.name} · {a.type}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3">Destination Organization</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {orgs.filter(o => o.id !== orgId).map(org => (
                <button key={org.id} onClick={() => setDestOrgId(org.id)}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-xl border text-left transition-colors',
                    destOrgId === org.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                  )}>
                  <Building2 size={16} className="text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{org.name}</p>
                    <p className="text-xs text-gray-500">{org.companyPrefix}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-2">Note (optional)</h3>
            <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Transfer reason..." />
          </div>

          <Button onClick={handleInitiate} disabled={selectedThings.size === 0 || !destOrgId}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
            <Send size={16} className="mr-2" /> Initiate Transfer ({selectedThings.size} thing{selectedThings.size !== 1 ? 's' : ''})
          </Button>
        </div>
      )}

      {/* Pending Tab */}
      {tab === 'pending' && (
        <div className="space-y-4">
          {pendingTransfers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No pending transfers for your organization.</div>
          ) : pendingTransfers.map(t => {
            const thing = mockDb.getAsset(t.thingId)
            const fromOrg = mockDb.getOrgById(t.fromOrgId)
            const toOrg = mockDb.getOrgById(t.toOrgId)
            const isIncoming = t.toOrgId === orgId
            const isOutgoing = t.fromOrgId === orgId
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <ArrowRightLeft size={20} className="text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{thing?.namespace || t.thingId}</p>
                    {isIncoming && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">INCOMING</span>}
                    {isOutgoing && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">OUTGOING</span>}
                  </div>
                  <p className="text-xs text-gray-500">{fromOrg?.name} → {toOrg?.name}</p>
                  {t.note && <p className="text-xs text-gray-400 mt-0.5 italic">{t.note}</p>}
                  <p className="text-[10px] text-gray-400 mt-1">{new Date(t.initiatedAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  {isIncoming ? (
                    <>
                      <Button size="sm" onClick={() => handleAccept(t.id)} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 h-8">
                        <Check size={14} className="mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(t.id)} className="rounded-lg h-8 text-red-500 hover:text-red-600">
                        <X size={14} className="mr-1" /> Reject
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">Awaiting response</span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-3">
          {historyTransfers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No transfer history for your organization.</div>
          ) : historyTransfers.map(t => {
            const thing = mockDb.getAsset(t.thingId)
            const fromOrg = mockDb.getOrgById(t.fromOrgId)
            const toOrg = mockDb.getOrgById(t.toOrgId)
            return (
              <div key={t.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100">
                <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold',
                  t.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600')}>
                  {t.status === 'completed' ? <Check size={14} /> : <X size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{thing?.namespace || t.thingId}</p>
                  <p className="text-xs text-gray-500">{fromOrg?.name} → {toOrg?.name}</p>
                  {t.note && <p className="text-xs text-gray-400 italic">{t.note}</p>}
                </div>
                <div className="text-right">
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                    t.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  )}>{t.status}</span>
                  <p className="text-[10px] text-gray-400 mt-1">{t.completedAt && new Date(t.completedAt).toLocaleDateString()}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast.isVisible && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-white text-gray-900 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 border border-gray-200">
            <Check size={14} /> <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
