'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { PictogramGrid } from '@/components/pictogram-grid'
import { ISLVideoPlayer } from '@/components/isl-video-player'
import { LiveKitVideoCall } from '@/components/livekit-video-call'
import { VisionGestureCamera } from '@/components/vision-gesture-camera'
import { useSessionRealtime } from '@/hooks/use-session-realtime'
import { getClipUrl } from '@/lib/isl-clips'
import type { DetailedPictogram } from '@/lib/pictograms'
import {
  CheckCircle2,
  Video,
  Shield,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// ─── Collapsible sign-language camera card ──────────────────────────────────────────

function GestureCameraCard({
  sendGestureText,
}: {
  sendGestureText: (text: string, confidence: number) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/50 overflow-hidden">
      {/* Header / toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
        aria-expanded={open}
        aria-controls="gesture-camera-panel"
      >
        <div className="flex items-center gap-2.5">
          {/* Hand icon */}
          <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
          </svg>
          <span className="text-sm font-medium text-white">Sign Language</span>
          <span className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded-full">
            ISL
          </span>
        </div>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible camera panel */}
      {open && (
        <div id="gesture-camera-panel" className="px-4 pb-4">
          <p className="text-xs text-gray-400 mb-3">
            Position your hands in front of the camera and perform a sign.
            The doctor will see your message instantly.
          </p>
          <VisionGestureCamera
            sendGestureText={sendGestureText}
            className="w-full"
          />
        </div>
      )}
    </div>
  )
}

// ─── Patient kiosk page ────────────────────────────────────────────────────────────

export default function PatientPage() {
  const params = useParams<{ sessionId: string }>()
  const sessionId = params.sessionId || '00000000-0000-0000-0000-000000000001'

  const [lastAlertText, setLastAlertText] = useState<string | null>(null)
  const [lastAlertHindi, setLastAlertHindi] = useState<string | null>(null)
  const [showingConfirmation, setShowingConfirmation] = useState(false)
  const [bedName, setBedName] = useState('Bedside Kiosk (ISL)')

  useEffect(() => {
    fetch(`/api/session?id=${sessionId}`)
      .then((res) => (res.ok && res.headers.get('content-type')?.includes('application/json') ? res.json() : null))
      .then((data) => {
        if (data?.session?.patient_display_name) {
          setBedName(data.session.patient_display_name)
        }
      })
      .catch(() => { })
  }, [sessionId])

  const {
    activeClip,
    sessionStatus,
    sendPictogramAlert,
    clearClip,
    sendStatusChange,
    requestInterpreter,
    sendGestureText,
    cancelInterpreterRequest,
  } = useSessionRealtime({
    sessionId,
  })

  const handleCancelInterpreter = () => {
    cancelInterpreterRequest()
    toast.info('Interpreter request cancelled / अनुरोध रद्द किया गया')
  }

  const handleTriggerAlert = (pictogram: DetailedPictogram, extraNote?: string) => {
    // 1. Send instant alert via Realtime broadcast
    sendPictogramAlert(pictogram.key, pictogram.label, pictogram.category)

    // 2. Show clear confirmation banner for Deaf patient
    setLastAlertText(extraNote ? `${pictogram.label} (${extraNote})` : pictogram.label)
    setLastAlertHindi(pictogram.hindiText || 'डॉक्टर को सूचित कर दिया गया है')
    setShowingConfirmation(true)

    toast.success(`Alert Sent: ${pictogram.label} ${extraNote ? `(${extraNote})` : ''} • डॉक्टर को सूचित किया गया`)
  }

  const handleRequestInterpreter = () => {
    requestInterpreter({
      hospitalName: 'Apollo Multi-Specialty Hospital',
      patientName: bedName,
      note: 'Bedside request from patient tablet',
    })
    toast.info('Paging ISL interpreter...')
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
                  {bedName}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Touch any card to alert medical staff immediately
              </p>
            </div>
          </div>

          <div className="sm:hidden">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
              {bedName}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-4 md:p-6 flex flex-col gap-4">
        {/* Dedicated 1-Tap ISL Interpreter Call Card for Deaf Patient */}
        {sessionStatus === 'interpreter_requested' ? (
          <div className="w-full p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 dark:bg-amber-950/40 dark:border-amber-600 dark:text-amber-100 flex items-center justify-between gap-3 shadow-md animate-pulse">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-200 dark:bg-amber-900/60 rounded-full shrink-0">
                <Video className="w-6 h-6 text-amber-800 dark:text-amber-200 animate-bounce" />
              </div>
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-amber-800 dark:text-amber-300 block">
                  Interpreter Paged • अनुवादक को संदेश भेजा गया है
                </span>
                <h3 className="text-base sm:text-lg font-black">
                  Connecting to Remote ISL Interpreter...
                </h3>
                <p className="text-xs opacity-80 mt-0.5">
                  Please stay in front of this screen. The video relay will launch automatically once accepted.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
                Connecting...
              </span>
              <Button
                variant="outline"
                onClick={handleCancelInterpreter}
                className="bg-white/90 dark:bg-slate-900 border-amber-600 dark:border-amber-400 text-amber-950 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-slate-800 font-extrabold text-xs sm:text-sm h-10 px-4 rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <X className="w-4 h-4 text-red-600" />
                <span>Cancel / रद्द करें</span>
              </Button>
            </div>
          </div>
        ) : sessionStatus !== 'interpreter_connected' && (
          <div className="w-full p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-teal-50 dark:from-indigo-950/30 dark:to-teal-950/30 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#4F46E5] text-white shrink-0 shadow">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  Need Indian Sign Language Translation? / क्या आपको सांकेतिक भाषा अनुवादक चाहिए?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Connect 2-party live HD video with a certified ISL interpreter directly from this tablet.
                </p>
              </div>
            </div>
            <Button
              onClick={handleRequestInterpreter}
              className="w-full sm:w-auto bg-[#4F46E5] hover:bg-[#4338CA] text-white font-black text-xs sm:text-sm h-10 px-5 rounded-xl flex items-center justify-center gap-2 shadow"
            >
              <Video className="w-4 h-4" />
              <span>🤟 Call Live Interpreter / अनुवादक बुलाएं</span>
            </Button>
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
                  Alert Sent to Nurse Station / डॉक्टर को संदेश भेजा गया
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

        {/* Live Interpreter Video Window (Direct Embedded WebRTC) */}
        {sessionStatus === 'interpreter_connected' && (
          <div className="w-full rounded-2xl overflow-hidden bg-slate-950 border-4 border-indigo-500 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-950 px-4 py-2 border-b border-indigo-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-300 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Live ISL Interpreter Relay Connected • लाइव वीडियो अनुवादक जुड़ा हुआ है
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendStatusChange('active')}
                className="h-7 text-xs border-indigo-400 bg-indigo-900/80 text-white hover:bg-indigo-800 font-bold"
              >
                Disconnect Call
              </Button>
            </div>
            <div className="h-[360px] sm:h-[420px] w-full">
              <LiveKitVideoCall
                roomName={sessionId}
                participantName="Patient (Bed 4A)"
                participantIdentity={`patient-${sessionId.slice(0, 6)}`}
                role="patient"
                onDisconnect={() => sendStatusChange('active')}
              />
            </div>
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

        {/* Sign Language Camera Card (P3 — ISL gesture recognition) */}
        <GestureCameraCard sendGestureText={sendGestureText} />
      </div>

      {/* ISL Video Player Modal (Triggered automatically when clip received) */}
      {activeClip && (
        <ISLVideoPlayer
          clipKey={activeClip.clipKey}
          clipLabel={activeClip.label}
          videoUrl={
            activeClip.clipUrl && activeClip.clipUrl.startsWith('http')
              ? activeClip.clipUrl
              : getClipUrl(activeClip.clipKey)
          }
          onClose={clearClip}
        />
      )}



      {/* Patient Footer */}
      <footer className="p-3 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
        Ishara Clinical Care Kiosk • Bedside Tablet Mode • WCAG AAA Accessible
      </footer>
    </main>
  )
}
