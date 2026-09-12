'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  Play,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Send,
} from 'lucide-react'
import { searchClips } from '@/lib/isl-clips'
import { toast } from 'sonner'

interface InterpreterFallbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPlayClip: (clipKey: string, clipUrl: string, label: string) => void
  onRetryPaging: () => void
  sessionId: string
}

const REASSURANCE_CLIPS = [
  {
    key: 'you-are-safe',
    label: 'You are safe',
    hindi: 'आप सुरक्षित हैं',
    category: 'Reassurance',
    description: 'Immediate calming sign to reduce patient panic during delay',
  },
  {
    key: 'we-are-helping',
    label: 'We are helping you',
    hindi: 'हम आपकी मदद कर रहे हैं',
    category: 'Care',
    description: 'Affirms that medical team is actively preparing care',
  },
  {
    key: 'take-medicine',
    label: 'Take this medicine',
    hindi: 'यह दवा लें',
    category: 'Treatment',
    description: 'Instructs patient regarding oral or IV medication',
  },
  {
    key: 'stay-still',
    label: 'Stay still',
    hindi: 'शांत रहें / हिले नहीं',
    category: 'Procedure',
    description: 'Critical instruction for examination or stabilization',
  },
  {
    key: 'chest-pain',
    label: 'Where is the pain?',
    hindi: 'दर्द कहाँ है?',
    category: 'Triage',
    description: 'Prompts patient to indicate pain location or severity',
  },
  {
    key: 'relax',
    label: 'Relax / breathe',
    hindi: 'आराम से सांस लें',
    category: 'Vitals',
    description: 'Helps lower tachycardia and hyperventilation',
  },
]

export function InterpreterFallbackModal({
  open,
  onOpenChange,
  onPlayClip,
  onRetryPaging,
  sessionId,
}: InterpreterFallbackModalProps) {
  const [sentKeys, setSentKeys] = useState<Record<string, boolean>>({})

  const handleSendClip = (clipKey: string, label: string) => {
    // Resolve URL via searchClips or fallback path
    const matches = searchClips(clipKey, 1)
    const clipUrl = matches.length > 0 ? matches[0].signedUrl : `/videos/${clipKey}.mp4`

    onPlayClip(clipKey, clipUrl, label)
    setSentKeys((prev) => ({ ...prev, [clipKey]: true }))
    toast.success(`Broadcasting ISL clip "${label}" to patient tablet!`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-red-500/40 shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 shrink-0">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-black text-red-600 dark:text-red-400">
                  Interpreter Unreachable (60s Timeout)
                </DialogTitle>
                <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 uppercase">
                  P2 AI Fallback
                </span>
              </div>
              <DialogDescription className="text-xs text-slate-600 dark:text-slate-400">
                No human interpreter connected within 60s. Auto-switched session to pre-recorded AI sign clips.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Emergency Clinical Protocol Notice */}
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block">Hospital Ergonomics Auto-Escalation:</strong>
            The patient tablet has been notified of the delay. Tap any of the clinical signs below to immediately display high-definition ISL guidance on the bedside monitor:
          </div>
        </div>

        {/* Curated AI Sign Language Clips Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[290px] overflow-y-auto pr-1">
          {REASSURANCE_CLIPS.map((clip) => {
            const isSent = !!sentKeys[clip.key]
            return (
              <div
                key={clip.key}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                  isSent
                    ? 'bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                      {clip.category}
                    </span>
                    {isSent && (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Sent
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                    {clip.label}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {clip.hindi}
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSendClip(clip.key, clip.label)}
                  className={`w-full text-xs font-bold h-8 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                    isSent
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-[#084C5B] hover:bg-[#0D748A] text-white'
                  }`}
                >
                  {isSent ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Sent (Play Again)
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Play ISL Sign
                    </>
                  )}
                </Button>
              </div>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onRetryPaging()
              onOpenChange(false)
            }}
            className="w-full sm:w-auto text-xs font-bold border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Human Interpreter (Reset 60s)
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white"
          >
            Dismiss & Use Clinical Console
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
