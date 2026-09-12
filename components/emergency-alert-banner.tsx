'use client'

import React, { useEffect } from 'react'
import { AlertCircle, CheckCircle2, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PictogramAlertPayload } from '@/lib/types'

interface EmergencyAlertBannerProps {
  alert: PictogramAlertPayload | null
  onAcknowledge: () => void
  onRequestInterpreter?: () => void
}

/**
 * Play a gentle but prominent clinical chime using Web Audio API.
 * Requires no external audio files and works offline.
 */
function playClinicalChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const now = ctx.currentTime

    // Two-tone alert (523Hz C5 -> 659Hz E5)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(523.25, now)
    osc1.frequency.setValueAtTime(659.25, now + 0.15)
    gain1.gain.setValueAtTime(0.3, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.5)
  } catch {
    // Ignore audio permission or autoplay errors
  }
}

export function EmergencyAlertBanner({
  alert,
  onAcknowledge,
  onRequestInterpreter,
}: EmergencyAlertBannerProps) {
  useEffect(() => {
    if (alert) {
      playClinicalChime()
    }
  }, [alert])

  if (!alert) return null

  const isCritical = alert.category?.toLowerCase().includes('emergency') || alert.clipKey.includes('pain') || alert.clipKey.includes('breathe')

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`
        w-full p-4 rounded-xl border-2 mb-4 shadow-lg animate-pulse transition-all
        ${isCritical
          ? 'bg-red-50 border-red-600 text-red-950 dark:bg-red-950/80 dark:border-red-500 dark:text-red-100'
          : 'bg-amber-50 border-amber-600 text-amber-950 dark:bg-amber-950/80 dark:border-amber-500 dark:text-amber-100'
        }
      `}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-red-600 text-white shrink-0">
            <AlertCircle className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-red-600 text-white">
                Patient Triage Alert
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black mt-0.5">
              {alert.label}
            </h3>
            <p className="text-xs sm:text-sm opacity-90">
              Patient tapped pictogram on bedside kiosk tablet
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {onRequestInterpreter && (
            <Button
              size="sm"
              onClick={onRequestInterpreter}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white flex items-center gap-1.5"
            >
              <Video className="w-4 h-4" />
              Page Interpreter
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onAcknowledge}
            className="border-slate-400 bg-white/80 dark:bg-slate-900/80 hover:bg-white flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Acknowledge
          </Button>
        </div>
      </div>
    </div>
  )
}
