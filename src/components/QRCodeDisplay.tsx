import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Download, Printer } from 'lucide-react'
import { Button } from '#/components/ui/button'

interface QRCodeDisplayProps {
  value: string
  size?: number
  label?: string
}

export function QRCodeDisplay({ value, size = 200, label }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!canvasRef.current || !value) return
    setError(false)
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    }).catch(() => setError(true))
  }, [value, size])

  const handleDownload = () => {
    if (!canvasRef.current) return
    const url = canvasRef.current.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'qr-code.png'
    a.click()
  }

  const handlePrint = () => {
    if (!canvasRef.current) return
    const url = canvasRef.current.toDataURL('image/png')
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`
      <html><head><title>QR Label</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;margin:0;}</style>
      </head><body>
      <img src="${url}" style="width:300px;height:300px;" />
      <p style="font-size:12px;word-break:break-all;max-width:400px;text-align:center;margin-top:16px;">${value}</p>
      <script>window.onload=function(){window.print();}</script>
      </body></html>
    `)
    w.document.close()
  }

  if (!value) return null
  if (error) return <p className="text-xs text-muted-foreground">Failed to generate QR code</p>

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} />
      {label && (
        <p className="text-xs text-muted-foreground text-center max-w-[250px] break-all">
          {label}
        </p>
      )}
      <p className="text-[10px] text-muted-foreground text-center max-w-[250px] break-all font-mono">
        {value}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="xs" onClick={handleDownload}>
          <Download className="mr-1 h-3 w-3" />
          PNG
        </Button>
        <Button variant="outline" size="xs" onClick={handlePrint}>
          <Printer className="mr-1 h-3 w-3" />
          Print
        </Button>
      </div>
    </div>
  )
}
