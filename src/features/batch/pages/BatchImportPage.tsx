import { useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'motion/react'
import Papa from 'papaparse'
import { Upload, FileSpreadsheet, Check, X, AlertCircle, Download, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import { mockDb } from '#/lib/mockDb'
import { getCurrentOrgId } from '#/lib/tenant'
import {
  buildSgtinElementString, buildCpiElementString, buildGiaiElementString, buildGsrnElementString,
  buildSgtinUri, buildCpiUri, buildGiaiUri, buildGsrnUri,
  buildSgtinTagUri, buildCpiTagUri, buildGiaiTagUri, buildGsrnTagUri,
  encodeToHex,
} from '#/lib/gs1'

interface RawRow { [key: string]: string }

interface MappedRow {
  type: string; company_prefix: string; namespace: string; description: string;
  indicator_digit: string; item_reference: string; serial_number: string;
  component_part_ref: string; cpi_serial: string;
  asset_reference: string; service_reference: string; status: string;
}

interface ValidatedRow extends MappedRow {
  valid: boolean; error?: string;
}

const SAMPLE_CSV = `type,company_prefix,namespace,description,indicator_digit,item_reference,serial_number,status
consumable,0614141,acme,Widget Alpha,0,35001,100001,active
consumable,0614141,acme,Widget Beta,0,35001,100002,active
fixed,4000521,siemens,CNC Machine Unit 7,,,MACH007,active
human,8858718,thingdaddy,Staff Badge - John,,,,active`

const FIELD_KEYS: (keyof MappedRow)[] = [
  'type', 'company_prefix', 'namespace', 'description',
  'indicator_digit', 'item_reference', 'serial_number',
  'component_part_ref', 'cpi_serial', 'asset_reference', 'service_reference', 'status',
]

export default function BatchImportPage() {
  const navigate = useNavigate()
  const orgId = getCurrentOrgId()
  const currentOrg = orgId ? mockDb.getOrgById(orgId) : undefined
  const [step, setStep] = useState(1)
  const [rawData, setRawData] = useState<RawRow[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, keyof MappedRow | ''>>({})
  const [validated, setValidated] = useState<ValidatedRow[]>([])
  const [importResult, setImportResult] = useState<{ imported: number; errors: number } | null>(null)

  const handleFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const data = result.data as RawRow[]
        if (data.length === 0) return
        setRawData(data)
        setColumns(Object.keys(data[0]))
        // Auto-map columns by name similarity
        const autoMap: Record<string, keyof MappedRow | ''> = {}
        for (const col of Object.keys(data[0])) {
          const lower = col.toLowerCase().replace(/[^a-z0-9]/g, '')
          for (const field of FIELD_KEYS) {
            if (lower.includes(field.replace(/_/g, ''))) {
              autoMap[col] = field; break
            }
          }
          if (!autoMap[col]) autoMap[col] = ''
        }
        setMapping(autoMap)
        setStep(2)
      },
    })
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  const handleValidate = () => {
    const rows: ValidatedRow[] = rawData.map(raw => {
      const mapped: MappedRow = { type: '', company_prefix: '', namespace: '', description: '',
        indicator_digit: '', item_reference: '', serial_number: '',
        component_part_ref: '', cpi_serial: '', asset_reference: '', service_reference: '', status: 'active',
      }
      for (const [col, field] of Object.entries(mapping)) {
        if (field && raw[col]) (mapped as any)[field] = raw[col].trim()
      }
      // Validate
      const errors: string[] = []
      if (!['consumable', 'wip', 'fixed', 'human'].includes(mapped.type)) errors.push('Invalid type')
      if (!/^\d{6,12}$/.test(mapped.company_prefix)) errors.push('Invalid prefix')
      else if (currentOrg && mapped.company_prefix !== currentOrg.companyPrefix) errors.push(`Prefix does not match your organization (${currentOrg.companyPrefix})`)
      if (!mapped.namespace) errors.push('Missing namespace')
      return { ...mapped, valid: errors.length === 0, error: errors.join('; ') }
    })
    setValidated(rows)
    setStep(3)
  }

  const handleImport = () => {
    let imported = 0, errors = 0
    for (const row of validated) {
      if (!row.valid) { errors++; continue }
      try {
        const importOrgId = orgId || mockDb.getOrgByPrefix(row.company_prefix)?.id || ''
        if (!importOrgId) { errors++; continue }
        const prefix = row.company_prefix
        const ns = row.namespace
        const type = row.type
        let urn = '', epcUri = '', epcTagUri = '', elementString = '', instance = ''

        if (type === 'consumable') {
          const ind = row.indicator_digit || '0'
          const ir = row.item_reference || '0'
          const serial = row.serial_number || String(Date.now()).slice(-6)
          elementString = buildSgtinElementString(prefix, ind, ir, serial)
          epcUri = buildSgtinUri(prefix, ind, ir, serial)
          epcTagUri = buildSgtinTagUri(prefix, ind, ir, serial, 0, 96)
          instance = serial
        } else if (type === 'wip') {
          const pr = row.component_part_ref || '0'
          const serial = row.cpi_serial || '0'
          elementString = buildCpiElementString(prefix, pr, serial)
          epcUri = buildCpiUri(prefix, pr, serial)
          epcTagUri = buildCpiTagUri(prefix, pr, serial, 0, 96)
          instance = serial
        } else if (type === 'fixed') {
          const ar = row.asset_reference || '0'
          elementString = buildGiaiElementString(prefix, ar)
          epcUri = buildGiaiUri(prefix, ar)
          epcTagUri = buildGiaiTagUri(prefix, ar, 0, 96)
          instance = ar
        } else if (type === 'human') {
          const sr = row.service_reference || '0'
          elementString = buildGsrnElementString(prefix, sr)
          epcUri = buildGsrnUri(prefix, sr)
          epcTagUri = buildGsrnTagUri(prefix, sr, 0)
          instance = sr
        }

        urn = `urn:thingdaddy:${ns}:${type}:${instance}`
        const rfid = encodeToHex(epcTagUri)

        mockDb.saveAsset({
          id: crypto.randomUUID(), orgId: importOrgId, gs1CompanyPrefix: prefix, namespace: ns,
          urn, epcUri, epcTagUri, elementString, rfid, type,
          description: row.description || undefined, status: (row.status as any) || 'active',
          createdAt: new Date().toISOString(),
        })
        imported++
      } catch { errors++ }
    }
    setImportResult({ imported, errors })
    setStep(4)
  }

  const downloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'thingdaddy-import-template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const validCount = validated.filter(r => r.valid).length
  const errorCount = validated.filter(r => !r.valid).length

  return (
    <main className="min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Batch Import</h1>
        <p className="text-gray-500 mt-2">Import multiple things from a CSV file.</p>
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-indigo-400 transition-colors"
          >
            <Upload className="mx-auto h-10 w-10 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">Drag & drop a CSV file here, or</p>
            <label className="cursor-pointer">
              <Button variant="outline" className="rounded-xl" asChild>
                <span>
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Choose File
                </span>
              </Button>
              <input type="file" accept=".csv,.xlsx" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </label>
          </div>
          <Button variant="ghost" onClick={downloadTemplate} className="text-sm">
            <Download className="mr-2 h-4 w-4" /> Download CSV Template
          </Button>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === 2 && (
        <div className="space-y-6">
          <p className="text-sm text-gray-500">{rawData.length} rows found. Map columns to ThingDaddy fields:</p>
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr><th className="px-4 py-2 text-left">CSV Column</th><th className="px-4 py-2 text-left">Maps To</th><th className="px-4 py-2 text-left">Sample</th></tr>
              </thead>
              <tbody>
                {columns.map(col => (
                  <tr key={col} className="border-t">
                    <td className="px-4 py-2 font-mono text-xs">{col}</td>
                    <td className="px-4 py-2">
                      <select value={mapping[col] || ''} onChange={e => setMapping(prev => ({ ...prev, [col]: e.target.value as any }))}
                        className="border rounded-md px-2 py-1 text-xs w-full">
                        <option value="">— skip —</option>
                        {FIELD_KEYS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500 truncate max-w-[200px]">{rawData[0]?.[col]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={handleValidate} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
              Validate <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Validation */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium">
              <Check className="inline h-4 w-4 mr-1" /> {validCount} valid
            </div>
            {errorCount > 0 && (
              <div className="px-4 py-2 rounded-xl bg-red-50 text-red-700 text-sm font-medium">
                <AlertCircle className="inline h-4 w-4 mr-1" /> {errorCount} errors
              </div>
            )}
          </div>
          <div className="border rounded-xl overflow-auto max-h-[400px]">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left w-8"></th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Prefix</th>
                  <th className="px-3 py-2 text-left">Namespace</th>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-left">Error</th>
                </tr>
              </thead>
              <tbody>
                {validated.map((row, i) => (
                  <tr key={i} className={cn('border-t', !row.valid && 'bg-red-50/50')}>
                    <td className="px-3 py-2">{row.valid ? <Check size={14} className="text-emerald-500" /> : <X size={14} className="text-red-500" />}</td>
                    <td className="px-3 py-2">{row.type}</td>
                    <td className="px-3 py-2 font-mono">{row.company_prefix}</td>
                    <td className="px-3 py-2">{row.namespace}</td>
                    <td className="px-3 py-2 truncate max-w-[150px]">{row.description}</td>
                    <td className="px-3 py-2 text-red-600">{row.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={handleImport} disabled={validCount === 0} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
              Import {validCount} Things <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === 4 && importResult && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-white rounded-3xl border shadow-sm">
          <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Complete</h2>
          <p className="text-gray-500 mb-1">{importResult.imported} thing(s) imported successfully.</p>
          {importResult.errors > 0 && <p className="text-red-500 text-sm">{importResult.errors} row(s) skipped due to errors.</p>}
          <div className="mt-6">
            <Button onClick={() => navigate({ to: '/list' })} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
              View All Things
            </Button>
          </div>
        </motion.div>
      )}
    </main>
  )
}
