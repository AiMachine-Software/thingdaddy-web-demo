import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  createConnection,
  PLATFORM_LABELS,
  type CloudPlatform,
} from '#/lib/cloudConnections'
import { mockDb } from '#/lib/mockDb'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedAssetIds: string[]
  orgId: string
  onApplied?: (count: number) => void
}

const PLATFORMS: CloudPlatform[] = ['azure', 'aws', 'gcp', 'fiware', 'custom']

export default function BulkConnectModal({
  open,
  onOpenChange,
  selectedAssetIds,
  orgId,
  onApplied,
}: Props) {
  const [platform, setPlatform] = useState<CloudPlatform>('azure')
  const [endpoint, setEndpoint] = useState('')
  const [pattern, setPattern] = useState('{company}-{name}-{serial}')

  const org = mockDb.getOrgById(orgId)

  const renderId = (assetId: string): string => {
    const asset = mockDb.getAsset(assetId)
    if (!asset) return assetId
    const serial = asset.urn.split(':').pop() ?? asset.id
    return pattern
      .replace('{company}', org?.name?.toLowerCase().replace(/\s+/g, '-') ?? 'org')
      .replace('{name}', asset.namespace)
      .replace('{serial}', serial)
  }

  const handleApply = () => {
    let count = 0
    for (const assetId of selectedAssetIds) {
      const externalDeviceId = renderId(assetId)
      createConnection({
        thingId: assetId,
        orgId,
        platform,
        externalDeviceId,
        endpoint: endpoint || undefined,
      })
      count++
    }
    if (onApplied) onApplied(count)
    onOpenChange(false)
  }

  const previewIds = selectedAssetIds.slice(0, 3).map(renderId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Cloud Connect</DialogTitle>
          <DialogDescription>
            Connect {selectedAssetIds.length} selected Thing
            {selectedAssetIds.length === 1 ? '' : 's'} to a cloud platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Platform</Label>
            <Select
              value={platform}
              onValueChange={(v) => setPlatform(v as CloudPlatform)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PLATFORM_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Common Endpoint / Hub
            </Label>
            <Input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="e.g. milesight-iot.azure-devices.net"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Device ID Pattern
            </Label>
            <Input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-[10px] text-gray-500">
              Tokens: <code>{'{company}'}</code>, <code>{'{name}'}</code>,{' '}
              <code>{'{serial}'}</code>
            </p>
          </div>

          {previewIds.length > 0 && (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Preview
              </p>
              <ul className="space-y-1">
                {previewIds.map((id) => (
                  <li key={id} className="font-mono text-[11px] text-indigo-700 truncate">
                    {id}
                  </li>
                ))}
                {selectedAssetIds.length > 3 && (
                  <li className="text-[10px] text-gray-400">
                    …and {selectedAssetIds.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={selectedAssetIds.length === 0}
          >
            Apply to {selectedAssetIds.length}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
