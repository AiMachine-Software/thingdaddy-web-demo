import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Download, Upload, Check, AlertCircle } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { mockDb, type Asset } from '#/lib/mockDb'
import { getCurrentOrgId } from '#/lib/tenant'

interface ExportData {
  version: string
  exportedAt: string
  things: Asset[]
}

export function ExportImportPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importPreview, setImportPreview] = useState<ExportData | null>(null)
  const [toast, setToast] = useState<{ message: string; isVisible: boolean; isError?: boolean }>({
    message: '',
    isVisible: false,
  })

  const showToast = (message: string, isError = false) => {
    setToast({ message, isVisible: true, isError })
    setTimeout(() => setToast({ message: '', isVisible: false }), 3000)
  }

  const orgId = getCurrentOrgId()

  const handleExport = () => {
    const assets = mockDb.getAssets(orgId || undefined)
    const data: ExportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      things: assets,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `thingdaddy-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast(`Exported ${assets.length} things`)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as ExportData
        if (!data.things || !Array.isArray(data.things)) {
          showToast('Invalid file format: missing "things" array', true)
          return
        }
        setImportPreview(data)
      } catch {
        showToast('Invalid JSON file', true)
      }
    }
    reader.readAsText(file)
    // Reset so same file can be selected again
    e.target.value = ''
  }

  const handleImport = (mode: 'merge' | 'replace') => {
    if (!importPreview) return
    // Override orgId to current org for all imported things
    const incoming = importPreview.things.map(t => orgId ? { ...t, orgId } : t)

    if (mode === 'replace') {
      // Only clear current org's assets, then add imported
      if (orgId) {
        const allAssets = mockDb.getAssets()
        const otherOrgAssets = allAssets.filter(a => a.orgId !== orgId)
        mockDb.clearAssets()
        for (const thing of [...otherOrgAssets].reverse()) {
          mockDb.saveAsset(thing)
        }
      } else {
        mockDb.clearAssets()
      }
      for (const thing of [...incoming].reverse()) {
        mockDb.saveAsset(thing)
      }
      showToast(`Replaced with ${incoming.length} things`)
    } else {
      const existing = mockDb.getAssets(orgId || undefined)
      const existingIds = new Set(existing.map((a) => a.id))
      let added = 0
      let skipped = 0
      for (const thing of incoming) {
        if (existingIds.has(thing.id)) {
          skipped++
        } else {
          mockDb.saveAsset(thing)
          added++
        }
      }
      showToast(`Imported ${added} things (${skipped} skipped as duplicates)`)
    }
    setImportPreview(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Button variant="outline" className="rounded-xl" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export My Things
        </Button>
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          Import JSON
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Import Preview */}
      <AnimatePresence>
        {importPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 overflow-hidden"
          >
            <p className="text-sm font-semibold text-gray-900">Import Preview</p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Version: {importPreview.version}</p>
              <p>Exported: {new Date(importPreview.exportedAt).toLocaleString()}</p>
              <p className="font-medium text-gray-700">{importPreview.things.length} things in file</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" className="rounded-lg" onClick={() => handleImport('merge')}>
                Merge (skip duplicates)
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="rounded-lg"
                onClick={() => handleImport('replace')}
              >
                Replace All
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-lg"
                onClick={() => setImportPreview(null)}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast.isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
              toast.isError
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {toast.isError ? <AlertCircle size={14} /> : <Check size={14} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
