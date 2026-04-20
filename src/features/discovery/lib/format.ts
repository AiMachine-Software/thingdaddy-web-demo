export function relativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = Math.max(0, now - then)
  const sec = Math.floor(diff / 1000)
  if (sec < 45) return `${sec || 1}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d ago`
  return new Date(iso).toLocaleDateString()
}

export function signalQuality(dBm?: number): 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' {
  if (dBm == null) return 'unknown'
  if (dBm >= -50) return 'excellent'
  if (dBm >= -65) return 'good'
  if (dBm >= -80) return 'fair'
  return 'poor'
}

export function formatMac(mac: string): string {
  return mac.toUpperCase()
}
