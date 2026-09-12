'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { PictogramGrid } from '@/components/pictogram-grid'
import { ISLVideoPlayer } from '@/components/isl-video-player'
import { StaffControlsDrawer } from '@/components/staff-controls-drawer'
import { useSessionRealtime } from '@/hooks/use-session-realtime'
import type { DetailedPictogram } from '@/lib/pictograms'
import {
  CheckCircle2,
  Video,
  Shield,
  Wifi,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function PatientPage() {
  const params = useParams<{ sessionId: string }>()
  const sessionId = params.sessionId || 'demo-session'

  const [lastAlertText, setLastAlertText] = useState<string | null>(null)
  const [lastAlertHindi, setLastAlertHindi] = useState<string | null>(null)
  const [showingConfirmation, setShowingConfirmation] = useState(false)

  const {
    activeClip,
    sessionStatus,
    sendPictogramAlert,
    sendPlayClip,
    clearClip,
    sendStatusChange,
  } = useSessionRealtime({
    sessionId,
  })

  const handleTriggerAlert = (pictogram: DetailedPictogram, extraNote?: string) => {
    // 1. Send instant alert via Realtime broadcast
    sendPictogramAlert(pictogram.key, pictogram.label, pictogram.category)

    // 2. Show clear confirmation banner for Deaf patient
    setLastAlertText(extraNote ? `${pictogram.label} (${extraNote})` : pictogram.label)
    setLastAlertHindi(pictogram.hindiText || 'डॉक्टर को सूचित कर दिया गया है')
    setShowingConfirmation(true)

    toast.success(`Alert Sent: ${pictogram.label} ${extraNote ? `(${extraNote})` : ''} • डॉक्टर को सूचित किया गया`)

    // Also auto-play reassurance clip if this is an emergency
    if (pictogram.priority === 'P0' && pictogram.key !== 'pain-level') {
      sendPlayClip(
        'we-are-helping',
        '/videos/we-are-helping.mp4',
        'We are helping you • डॉक्टर आ रहे हैं'
      )
    }
  }

  const handleDoctorPlayClip = (clipKey: string, clipUrl: string, label: string) => {
    sendPlayClip(clipKey, clipUrl, label)
  }

  const handleRequestInterpreter = () => {
    sendStatusChange('interpreter_requested')
    fetch(`/api/session/${sessionId}/request-interpreter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: 'Bedside request from patient tablet' }),
    }).catch(() => {})
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-teal-200">
      {/* Top Clinical Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-xs sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
              <Image
                src="/logo.png"
                alt="Ishara Logo"
                fill
                sizes="40px"
                className="object-contain p-1"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#084C5B] dark:text-teal-300">
                  Ishara • इशारा
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  ISL Bedside Kiosk
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Touch any card to alert medical staff immediately
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sessionStatus === 'interpreter_connected' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 border border-indigo-300 animate-pulse">
                <Video className="w-3.5 h-3.5 text-indigo-600" />
                Interpreter Live
              </span>
            ) : sessionStatus === 'interpreter_requested' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                Paging Interpreter...
              </span>
            ) : sessionStatus === 'ai_fallback' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200 border border-teal-300">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                AI Video Mode • एआई मोड
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                Ready • ऑनलाइन
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-4 md:p-6 flex flex-col gap-4">
        {/* AI Fallback Reassurance Banner for Deaf Patient */}
        {sessionStatus === 'ai_fallback' && (
          <div className="w-full p-4 rounded-2xl bg-teal-800 text-white shadow-xl border-2 border-teal-400 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-teal-200" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-teal-200 block">
                  AI Sign Language Video Mode • एआई सहायता
                </span>
                <h3 className="text-lg font-black">
                  अनुवादक व्यस्त हैं • डॉक्टर वीडियो संकेतों से बात कर रहे हैं
                </h3>
                <p className="text-xs text-teal-100 opacity-90">
                  All interpreters currently busy. Doctor is communicating directly using Ishara visual sign clips.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instant Alert Confirmation Banner */}
        {showingConfirmation && lastAlertText && (
          <div
            role="status"
            className="w-full p-4 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full shrink-0">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider opacity-90 block">
                  Alert Sent to Doctor / डॉक्टर को संदेश भेजा गया
                </span>
                <h2 className="text-xl sm:text-2xl font-black">
                  &ldquo;{lastAlertText}&rdquo; {lastAlertHindi && `• ${lastAlertHindi}`}
                </h2>
                <p className="text-xs opacity-80 mt-0.5">
                  Medical staff have been alerted. Please stay still.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowingConfirmation(false)}
              className="border-white/40 bg-white/10 hover:bg-white text-white hover:text-emerald-800 shrink-0 font-bold"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Live Interpreter Video Window (if connected) */}
        {sessionStatus === 'interpreter_connected' && (
          <div className="w-full p-4 rounded-2xl bg-indigo-900 text-white shadow-xl border-2 border-indigo-400 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-800 flex items-center justify-center shrink-0">
                <Video className="w-6 h-6 text-indigo-300 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">
                  Active Video Connection
                </span>
                <h3 className="text-lg font-black">
                  ISL Interpreter Connected
                </h3>
                <p className="text-xs text-indigo-200">
                  Doctor and remote interpreter are relaying in real time.
                </p>
              </div>
            </div>

            <Button
              onClick={() => {
                window.open(`/interpreter/call/${sessionId}`, '_blank')
              }}
              className="bg-white text-indigo-950 hover:bg-indigo-100 font-bold px-4 shadow"
            >
              Open Fullscreen Video
            </Button>
          </div>
        )}

        {/* Pictogram Grid (P0) */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#084C5B]" />
              Tap to Request Immediate Care / अपनी तकलीफ़ बताएं
            </h2>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Zero-latency broadcast to nurse station
            </span>
          </div>

          <PictogramGrid onTriggerAlert={handleTriggerAlert} />
        </div>
      </div>

      {/* ISL Video Player Modal (Triggered automatically when clip received) */}
      {activeClip && (
        <ISLVideoPlayer
          clipKey={activeClip.clipKey}
          clipLabel={activeClip.label}
          videoUrl={activeClip.clipUrl}
          onClose={clearClip}
        />
      )}

      {/* Bedside Clinician Controls Drawer */}
      <StaffControlsDrawer
        sessionId={sessionId}
        onRequestInterpreter={handleRequestInterpreter}
        onPlayClip={handleDoctorPlayClip}
        isInterpreterConnected={sessionStatus === 'interpreter_connected'}
      />

      {/* Patient Footer */}
      <footer className="p-3 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
        Ishara Clinical Care Kiosk • Bedside Tablet Mode • WCAG AAA Accessible
      </footer>
    </main>
  )
}
