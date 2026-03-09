// @mostajs/secu — Client subscriber card generator (print / download)
// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface ClientCardProps {
  client: {
    id: string
    clientNumber: string
    clientType: string
    firstName: string
    lastName: string
    phone?: string
    email?: string
    photo?: string
    wilaya?: string
    status: string
    qrCode: string
    createdAt: string
  }
  /** App name displayed on the card */
  appName?: string
  /** Card gradient colors [start, mid, end] */
  gradientColors?: [string, string, string]
  /** QR code generation function — must return a data URL */
  generateQrDataUrl?: (value: string) => Promise<string>
  /** Canvas capture function — must return a canvas from element */
  captureElement?: (element: HTMLElement) => Promise<HTMLCanvasElement>
}

export default function ClientCardGenerator({
  client,
  appName = 'SecuAccess Pro',
  gradientColors = ['#0369a1', '#1e40af', '#6d28d9'],
  generateQrDataUrl,
  captureElement,
}: ClientCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [qrCodeData, setQrCodeData] = useState('')

  useEffect(() => {
    if (generateQrDataUrl) {
      generateQrDataUrl(client.qrCode || client.id).then(setQrCodeData).catch(() => {})
    }
  }, [client, generateQrDataUrl])

  const exportCard = useCallback(async (mode: 'download' | 'print') => {
    if (!cardRef.current || !captureElement) return
    setIsGenerating(true)
    try {
      await new Promise((r) => setTimeout(r, 300))
      const canvas = await captureElement(cardRef.current)

      if (mode === 'download') {
        const link = document.createElement('a')
        link.download = `carte_${client.clientNumber}_${client.firstName}_${client.lastName}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      } else {
        const dataUrl = canvas.toDataURL('image/png')
        const printWindow = window.open('', '_blank')
        if (!printWindow) return
        printWindow.document.write(`<html><head><title>Carte ${client.clientNumber}</title>
<style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh}img{width:85.6mm;height:auto}@media print{body{margin:0}img{width:85.6mm}}</style></head><body>
<img src="${dataUrl}"/><script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`)
        printWindow.document.close()
      }
    } catch (err) {
      console.error('Card generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }, [client, captureElement])

  const statusLabel: Record<string, string> = { active: 'ACTIF', inactive: 'INACTIF', suspended: 'SUSPENDU' }
  const statusColor: Record<string, string> = { active: '#22c55e', inactive: '#6b7280', suspended: '#ef4444' }

  return (
    <div>
      {/* Card preview — ALL inline styles (html2canvas compatibility) */}
      <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '8px' }}>
        <div
          ref={cardRef}
          style={{ width: '340px', height: '214px', margin: '0 auto', overflow: 'hidden', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
        >
          <div style={{ position: 'relative', height: '100%', width: '100%', color: '#fff', background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 50%, ${gradientColors[2]} 100%)` }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}>{appName}</div>
                <div style={{ fontSize: '9px', opacity: 0.85, fontFamily: 'Arial, sans-serif' }}>Carte d&apos;Abonne</div>
              </div>
              <div style={{ fontSize: '9px', fontWeight: 600, fontFamily: 'Arial, sans-serif', backgroundColor: statusColor[client.status] || '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
                {statusLabel[client.status] || client.status.toUpperCase()}
              </div>
            </div>

            {/* Content */}
            <div style={{ display: 'flex', gap: '12px', padding: '12px 20px' }}>
              <div style={{ flex: 1, fontFamily: 'Arial, sans-serif' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {client.photo ? (
                    <img src={client.photo} alt={`${client.firstName} ${client.lastName}`} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    <span style={{ fontSize: '24px', opacity: 0.6 }}>&#128100;</span>
                  )}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{client.firstName} {client.lastName}</div>
                  <div style={{ fontSize: '10px', opacity: 0.85 }}>N&deg; {client.clientNumber}</div>
                </div>
                {client.wilaya && <div style={{ fontSize: '9px', opacity: 0.7, marginTop: '2px' }}>{client.wilaya}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {qrCodeData && (
                  <div style={{ backgroundColor: '#fff', padding: '6px', borderRadius: '4px' }}>
                    <img src={qrCodeData} alt="QR" style={{ width: '80px', height: '80px' }} />
                  </div>
                )}
                <div style={{ fontSize: '8px', marginTop: '4px', opacity: 0.8, textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>Code d&apos;acces</div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 20px', backgroundColor: 'rgba(0,0,0,0.2)', fontFamily: 'Arial, sans-serif' }}>
              <span style={{ fontSize: '9px' }}>Membre depuis {new Date(client.createdAt).getFullYear()}</span>
              <span style={{ fontSize: '9px', fontWeight: 600 }}>{appName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          onClick={() => exportCard('print')}
          disabled={isGenerating || !captureElement}
          style={{ flex: 1, padding: '6px 12px', fontSize: '13px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', cursor: isGenerating ? 'not-allowed' : 'pointer' }}
        >
          {isGenerating ? '...' : 'Imprimer'}
        </button>
        <button
          onClick={() => exportCard('download')}
          disabled={isGenerating || !captureElement}
          style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', cursor: isGenerating ? 'not-allowed' : 'pointer' }}
        >
          &#x21E9;
        </button>
      </div>
    </div>
  )
}
