'use client'

import React, { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Tablet,
  Maximize2,
  Minimize2,
  Sparkles,
  Wifi,
} from 'lucide-react'
import { toast } from 'sonner'

interface QRPairingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  patientName?: string
}

export function QRPairingModal({
  open,
  onOpenChange,
  sessionId,
  patientName = 'Patient Bed 4A',
}: QRPairingModalProps) {
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('')
  const [customHost, setCustomHost] = useState('')
  const [isEnlarged, setIsEnlarged] = useState(false)
  const [showNetworkConfig, setShowNetworkConfig] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
      setCustomHost(window.location.origin)
    }
  }, [])

  const baseOrigin = customHost.trim() || origin || 'http://localhost:3000'
  const patientUrl = `${baseOrigin}/patient/${sessionId}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(patientUrl)
      setCopied(true)
      toast.success('Patient tablet pairing URL copied to clipboard!')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error('Could not copy link to clipboard')
    }
  }

  const handleOpenTablet = () => {
    window.open(`/patient/${sessionId}`, '_blank')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isEnlarged ? 'sm:max-w-lg' : 'sm:max-w-md'} p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-teal-600/30 shadow-2xl transition-all`}>
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-[#084C5B] dark:text-teal-300">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-[#084C5B] dark:text-teal-300">
                  Instant Bedside QR Pairing
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Frictionless hospital ergonomics • Zero manual URL typing
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEnlarged(!isEnlarged)}
              title={isEnlarged ? 'Standard view' : 'Enlarge for across-bed scanning'}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              {isEnlarged ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </DialogHeader>

        {/* Patient / Bed Info Banner */}
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Target Bed: <strong className="text-teal-700 dark:text-teal-300">{patientName}</strong>
          </span>
          <span className="font-mono text-[11px] text-slate-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
            {sessionId.slice(0, 8)}
          </span>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-teal-50/50 to-white dark:from-slate-800/60 dark:to-slate-900 border border-teal-100 dark:border-slate-800 shadow-inner">
          <div className="p-4 bg-white rounded-2xl shadow-md border-2 border-slate-200/80">
            <QRCodeSVG
              value={patientUrl}
              size={isEnlarged ? 260 : 190}
              level="H"
              includeMargin={false}
              className="transition-all duration-300"
            />
          </div>

          <div className="mt-3 text-center space-y-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5">
              <Tablet className="w-3.5 h-3.5 text-teal-600" />
              Point iPad or Tablet Camera to Pair
            </p>
            <p className="text-[11px] text-slate-500">
              Instantly opens the ISL Bedside Kiosk in full WCAG AAA accessible mode
            </p>
          </div>
        </div>

        {/* Pairing URL & Actions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={patientUrl}
              className="h-9 text-xs font-mono bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-9 px-3 shrink-0 border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>

          {/* Wi-Fi / Local Network IP helper toggle */}
          <div className="text-right">
            <button
              type="button"
              onClick={() => setShowNetworkConfig(!showNetworkConfig)}
              className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 ml-auto"
            >
              <Wifi className="w-3 h-3" />
              {showNetworkConfig ? 'Hide Wi-Fi Host Config' : 'Pairing with Physical Tablet on Wi-Fi?'}
            </button>
          </div>

          {showNetworkConfig && (
            <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Physical Device LAN Pairing:
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-tight">
                If your tablet cannot resolve <code className="bg-amber-100 dark:bg-amber-900/60 px-1 rounded">localhost</code>, enter your computer&apos;s Wi-Fi IP address below (e.g. <code className="bg-amber-100 dark:bg-amber-900/60 px-1 rounded">http://192.168.1.45:3000</code>):
              </p>
              <Input
                value={customHost}
                onChange={(e) => setCustomHost(e.target.value)}
                placeholder="http://192.168.1.X:3000"
                className="h-8 text-xs font-mono bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700"
              />
            </div>
          )}

          {/* Primary Dialog Actions */}
          <div className="pt-2 flex items-center gap-2">
            <Button
              type="button"
              onClick={handleOpenTablet}
              className="flex-1 bg-[#084C5B] hover:bg-[#0D748A] text-white font-bold text-xs h-10 flex items-center justify-center gap-2 rounded-xl"
            >
              <ExternalLink className="w-4 h-4" />
              Open Tablet in New Tab
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs h-10 px-4 rounded-xl border-slate-200 dark:border-slate-800"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
