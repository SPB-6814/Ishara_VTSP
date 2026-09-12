'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { PictogramGrid } from '@/components/pictogram-grid'
import { ISLVideoPlayer } from '@/components/isl-video-player'
import { StaffControlsDrawer } from '@/components/staff-controls-drawer'
import { LiveKitVideoCall } from '@/components/livekit-video-call'
import { VisionGestureCamera } from '@/components/vision-gesture-camera'
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
    sendGestureText,
    clearClip,
    sendStatusChange,
    requestInterpreter,
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
  }

  const handleDoctorPlayClip = (clipKey: string, clipUrl: string, label: string) => {
    sendPlayClip(clipKey, clipUrl, label)
  }

  const handleRequestInterpreter = () => {
    requestInterpreter({
      hospitalName: 'Ishara Demo Hospital (ICU Bed 4)',
      patientName: 'Patient Bedside (ISL)',
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
              <Button
                size="sm"
                onClick={handleRequestInterpreter}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Call Interpreter</span>
              </Button>
            )}

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              Nurse Station Online
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-4 md:p-6 flex flex-col gap-4">
        {/* AI Fallback Reassurance Banner for Deaf Patient */}
        {sessionStatus === 'ai_fallback' ? (
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
        ) : sessionStatus === 'interpreter_requested' ? (
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
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-200 text-amber-900 shrink-0">
              Connecting...
            </span>
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

        {/* Client-side sign recognition with an explicit privacy shutter */}
        <section aria-label="Sign language gesture recognition" className="w-full max-w-xl mx-auto">
          <VisionGestureCamera
            onGestureDetected={(gesture) =>
              sendGestureText(gesture.text, gesture.confidence, gesture.timestamp)
            }
          />
        </section>

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
