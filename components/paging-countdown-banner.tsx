'use client'

import React from 'react'
import { Radio, AlertTriangle, FastForward, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PagingCountdownBannerProps {
  secondsLeft: number
  totalSeconds?: number
  onCancel: () => void
  onSkipToTimeout: () => void
}

export function PagingCountdownBanner({
  secondsLeft,
  totalSeconds = 60,
  onCancel,
  onSkipToTimeout,
}: PagingCountdownBannerProps) {
  const percentRemaining = Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100))

  return (
    <div className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white rounded-2xl p-4 shadow-xl border-2 border-amber-300 animate-in slide-in-from-top-3 duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider bg-white/20 px-2 py-0.5 rounded text-white/90">
                P1 Emergency Interpreter Page
              </span>
              <span className="text-xs font-mono font-bold bg-black/20 px-2 py-0.5 rounded text-amber-100">
                {secondsLeft}s remaining
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black mt-0.5">
              Paging Certified ISL Interpreters... Auto-fallback to AI Sign Clips in {secondsLeft}s
            </h3>
            <p className="text-xs text-amber-100 opacity-90">
              If unanswered, staff will be alerted and switched to pre-recorded ISL reassurance library.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <Button
            type="button"
            size="sm"
            onClick={onSkipToTimeout}
            variant="outline"
            className="border-white/30 bg-white/10 hover:bg-white/20 text-white font-bold text-xs h-8 px-2.5 flex items-center gap-1 shadow-sm"
            title="Fast-forward countdown for demonstration"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Fast Test Fallback</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onCancel}
            variant="ghost"
            className="text-white hover:bg-white/20 font-bold text-xs h-8 px-2.5 flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </Button>
        </div>
      </div>

      {/* Real-time Progress Bar */}
      <div className="mt-3 w-full bg-black/20 h-2 rounded-full overflow-hidden">
        <div
          className="bg-white h-full transition-all duration-1000 ease-linear rounded-full shadow-sm"
          style={{ width: `${percentRemaining}%` }}
        />
      </div>
    </div>
  )
}
