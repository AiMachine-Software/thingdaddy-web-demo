import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
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
  updateConnection,
  PLATFORM_LABELS,
  type CloudConnection,
  type CloudConnectionMetadata,
  type CloudPlatform,
} from '#/lib/cloudConnections'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  thingId: string
  orgId: string
  platform: CloudPlatform
  existing?: CloudConnection
  onSaved?: (conn: CloudConnection) => void
}

interface FormState {
  externalDeviceId: string
  endpoint: string
  metadata: CloudConnectionMetadata
}

function emptyForm(): FormState {
  return { externalDeviceId: '', endpoint: '', metadata: {} }
}

export default function ConnectModal({
  open,
  onOpenChange,
  thingId,
  orgId,
  platform,
  existing,
  onSaved,
}: Props) {
  const [form, setForm] = useState<FormState>(emptyForm())

  useEffect(() => {
    if (existing) {
      setForm({
        externalDeviceId: existing.externalDeviceId,
        endpoint: existing.endpoint ?? '',
        metadata: { ...existing.metadata },
      })
    } else {
      setForm(emptyForm())
    }
  }, [existing, open])

  const setMeta = <K extends keyof CloudConnectionMetadata>(
    key: K,
    value: CloudConnectionMetadata[K],
  ) => setForm((p) => ({ ...p, metadata: { ...p.metadata, [key]: value } }))

  const handleSave = () => {
    if (!form.externalDeviceId.trim()) return
    let saved: CloudConnection | undefined
    if (existing) {
      saved = updateConnection(existing.id, {
        externalDeviceId: form.externalDeviceId,
        endpoint: form.endpoint || undefined,
        metadata: form.metadata,
      })
    } else {
      saved = createConnection({
        thingId,
        orgId,
        platform,
        externalDeviceId: form.externalDeviceId,
        endpoint: form.endpoint || undefined,
        metadata: form.metadata,
      })
    }
    if (saved && onSaved) onSaved(saved)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {existing ? 'Edit ' : 'Connect to '}
            {PLATFORM_LABELS[platform]}
          </DialogTitle>
          <DialogDescription>
            Map this Thing to its identifier on {PLATFORM_LABELS[platform]}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {platform === 'azure' && (
            <>
              <Field label="Device ID" required>
                <Input
                  value={form.externalDeviceId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, externalDeviceId: e.target.value }))
                  }
                  placeholder="dev-milesight-gw1000-001"
                />
              </Field>
              <Field label="IoT Hub Hostname">
                <Input
                  value={form.metadata.iotHubHostname ?? ''}
                  onChange={(e) => {
                    setMeta('iotHubHostname', e.target.value)
                    setForm((p) => ({ ...p, endpoint: e.target.value }))
                  }}
                  placeholder="milesight-hub.azure-devices.net"
                />
              </Field>
              <Field label="DTDL Model ID (optional)">
                <Input
                  value={form.metadata.dtdlModelId ?? ''}
                  onChange={(e) => setMeta('dtdlModelId', e.target.value)}
                  placeholder="dtmi:milesight:gateway;1"
                />
              </Field>
              <Field label="Authentication">
                <Select
                  value={form.metadata.authMethod ?? 'SAS Token'}
                  onValueChange={(v) => setMeta('authMethod', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAS Token">SAS Token</SelectItem>
                    <SelectItem value="X.509 Certificate">X.509 Certificate</SelectItem>
                    <SelectItem value="Symmetric Key">Symmetric Key</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Connection String (optional)">
                <Input
                  type="password"
                  value={form.metadata.connectionString ?? ''}
                  onChange={(e) => setMeta('connectionString', e.target.value)}
                  placeholder="HostName=...;DeviceId=...;SharedAccessKey=..."
                />
              </Field>
            </>
          )}

          {platform === 'aws' && (
            <>
              <Field label="Thing Name" required>
                <Input
                  value={form.externalDeviceId}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, externalDeviceId: e.target.value }))
                    setMeta('thingName', e.target.value)
                  }}
                  placeholder="milesight/gateway/gw1000-001"
                />
              </Field>
              <Field label="Endpoint">
                <Input
                  value={form.endpoint}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, endpoint: e.target.value }))
                  }
                  placeholder="a1b2c3d4.iot.ap-southeast-1.amazonaws.com"
                />
              </Field>
              <Field label="Thing Type (optional)">
                <Input
                  value={form.metadata.thingType ?? ''}
                  onChange={(e) => setMeta('thingType', e.target.value)}
                  placeholder="IoTGateway"
                />
              </Field>
              <Field label="Shadow Name (optional)">
                <Input
                  value={form.metadata.shadowName ?? ''}
                  onChange={(e) => setMeta('shadowName', e.target.value)}
                  placeholder="firmware-status"
                />
              </Field>
            </>
          )}

          {platform === 'gcp' && (
            <>
              <Field label="Project ID" required>
                <Input
                  value={form.metadata.projectId ?? ''}
                  onChange={(e) => setMeta('projectId', e.target.value)}
                  placeholder="milesight-iot-prod"
                />
              </Field>
              <Field label="Registry ID">
                <Input
                  value={form.metadata.registryId ?? ''}
                  onChange={(e) => setMeta('registryId', e.target.value)}
                  placeholder="iot-registry"
                />
              </Field>
              <Field label="Device ID" required>
                <Input
                  value={form.externalDeviceId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, externalDeviceId: e.target.value }))
                  }
                  placeholder="device-001"
                />
              </Field>
              <Field label="Region">
                <Select
                  value={form.metadata.region ?? 'us-central1'}
                  onValueChange={(v) => setMeta('region', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us-central1">us-central1</SelectItem>
                    <SelectItem value="europe-west1">europe-west1</SelectItem>
                    <SelectItem value="asia-east1">asia-east1</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}

          {platform === 'fiware' && (
            <>
              <Field label="Entity ID" required>
                <Input
                  value={form.externalDeviceId}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, externalDeviceId: e.target.value }))
                    setMeta('entityId', e.target.value)
                  }}
                  placeholder="urn:ngsi-ld:Device:gw1000-001"
                />
              </Field>
              <Field label="Entity Type">
                <Input
                  value={form.metadata.entityType ?? ''}
                  onChange={(e) => setMeta('entityType', e.target.value)}
                  placeholder="Device"
                />
              </Field>
              <Field label="Context Broker URL">
                <Input
                  value={form.metadata.contextBrokerUrl ?? ''}
                  onChange={(e) => {
                    setMeta('contextBrokerUrl', e.target.value)
                    setForm((p) => ({ ...p, endpoint: e.target.value }))
                  }}
                  placeholder="https://orion.fiware.org"
                />
              </Field>
              <Field label="NGSI Version">
                <Select
                  value={form.metadata.ngsiVersion ?? 'LD'}
                  onValueChange={(v) => setMeta('ngsiVersion', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="v2">v2</SelectItem>
                    <SelectItem value="LD">LD</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}

          {platform === 'custom' && (
            <>
              <Field label="Device / Entity ID" required>
                <Input
                  value={form.externalDeviceId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, externalDeviceId: e.target.value }))
                  }
                  placeholder="my-device-001"
                />
              </Field>
              <Field label="Endpoint URL">
                <Input
                  value={form.endpoint}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, endpoint: e.target.value }))
                  }
                  placeholder="https://broker.example.com"
                />
              </Field>
              <Field label="Protocol">
                <Select
                  value={form.metadata.protocol ?? 'MQTT'}
                  onValueChange={(v) => setMeta('protocol', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MQTT">MQTT</SelectItem>
                    <SelectItem value="CoAP">CoAP</SelectItem>
                    <SelectItem value="HTTP">HTTP</SelectItem>
                    <SelectItem value="AMQP">AMQP</SelectItem>
                    <SelectItem value="LwM2M">LwM2M</SelectItem>
                    <SelectItem value="WebSocket">WebSocket</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Notes">
                <Textarea
                  value={form.metadata.notes ?? ''}
                  onChange={(e) => setMeta('notes', e.target.value)}
                  rows={3}
                />
              </Field>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!form.externalDeviceId.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {existing ? 'Save Changes' : 'Connect'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}
