'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { EmergencyAlertBanner } from '@/components/emergency-alert-banner'
import { TranscriptFeed } from '@/components/transcript-feed'
import { useSessionRealtime } from '@/hooks/use-session-realtime'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { searchClips } from '@/lib/isl-clips'
import {
  Video,
  Mic,
  MicOff,
  Send,
  ExternalLink,
  Sparkles,
  Clock,
  FileText,
  Loader2,
  QrCode,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function DashboardPage() {
  const params = useParams<{ sessionId: string }>()
  const sessionId = params.sessionId || 'demo-session'

  const [inputText, setInputText] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isPagingInterpreter, setIsPagingInterpreter] = useState(false)
  const [patientDisplayName, setPatientDisplayName] = useState('Patient Bed 4A (Ramesh)')
  const [pairingOpen, setPairingOpen] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [tabletUrl, setTabletUrl] = useState('')
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null)
  const [escalationTriggered, setEscalationTriggered] = useState(false)

  const {
    activeAlert,
    sessionStatus,
    events,
    clearAlert,
    sendPlayClip,
    requestInterpreter,
  } = useSessionRealtime({
    sessionId,
  })

  const {
    isSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition()

  useEffect(() => {
    if (transcript) {
      setInputText(transcript)
    }
  }, [transcript])

  // Fetch session details if available
  useEffect(() => {
    fetch(`/api/session?id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.session?.patient_display_name) {
          setPatientDisplayName(data.session.patient_display_name)
        }
      })
      .catch(() => {})
  }, [sessionId])

  const handleToggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      resetTranscript()
      startListening()
      toast.info('Listening for clinical speech...')
    }
  }

  const handleSendISLPhrase = async (phrase?: string) => {
    const query = phrase || inputText.trim()
    if (!query) return

    setIsSearching(true)
    try {
      const matches = searchClips(query, 1)

      if (matches.length > 0 && matches[0]) {
        const best = matches[0]
        sendPlayClip(best.clip.key, best.signedUrl, best.clip.label)
        toast.success(`Broadcasting ISL clip "${best.clip.label}" to patient tablet`)
        setInputText('')
        resetTranscript()
      } else {
        toast.error(`No matching ISL clip found for "${query}". Try rephrasing or requesting an interpreter.`)
      }
    } catch {
      toast.error('Failed to lookup ISL sign')
    } finally {
      setIsSearching(false)
    }
  }

  const handlePageInterpreter = () => {
    setIsPagingInterpreter(true)
    requestInterpreter({
      hospitalName: 'Ishara Demo Hospital',
      patientName: patientDisplayName,
      note: 'Staff station remote paging',
    })
    toast.info('Paging ISL interpreters...')
    setTimeout(() => setIsPagingInterpreter(false), 2500)
  }

  // Tablet pairing URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTabletUrl(`${window.location.origin}/patient/${sessionId}`)
    }
  }, [sessionId])

  const handleCopyTabletUrl = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(tabletUrl)
      setCopiedUrl(true)
      toast.success('Bedside tablet link copied!')
      setTimeout(() => setCopiedUrl(false), 2000)
    }
  }

  // 60-Second Auto-Fallback Escalation Timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    if (sessionStatus === 'interpreter_requested') {
      setCountdownSeconds(60)
      setEscalationTriggered(false)
      timer = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev === null || prev <= 1) {
            setEscalationTriggered(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      setCountdownSeconds(null)
      setEscalationTriggered(false)
      if (timer) clearInterval(timer)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [sessionStatus])

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
              <Image
                src="/logo.png"
                alt="Ishara Logo"
                fill
                sizes="36px"
                className="object-contain p-1"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-[#084C5B] dark:text-teal-300">
                  Ishara Clinical Station
                </h1>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200">
                  Doctor / Staff Monitor
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Patient: <span className="font-bold text-slate-800 dark:text-slate-200">{patientDisplayName}</span> • Session: {sessionId.slice(0, 8)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPairingOpen(true)}
              className="border-teal-300 text-[#084C5B] hover:bg-teal-50 dark:border-teal-700 dark:text-teal-300 text-xs flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              Pair Tablet
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/patient/${sessionId}`, '_blank')}
              className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 text-xs flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Tablet
            </Button>

            <Button
              size="sm"
              onClick={handlePageInterpreter}
              disabled={isPagingInterpreter || sessionStatus === 'interpreter_connected'}
              className={`
                text-xs font-bold flex items-center gap-1.5
                ${sessionStatus === 'interpreter_connected'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-[#4F46E5] hover:bg-[#4338CA] text-white'
                }
              `}
            >
              <Video className="w-4 h-4" />
              {sessionStatus === 'interpreter_connected'
                ? 'Interpreter Active'
                : isPagingInterpreter
                ? 'Paging...'
                : 'Page Interpreter'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Emergency Alert Banner (P0 Realtime) */}
        <EmergencyAlertBanner
          alert={activeAlert}
          onAcknowledge={clearAlert}
          onRequestInterpreter={handlePageInterpreter}
        />

        {/* 60-Second Auto-Fallback Escalation Alert */}
        {sessionStatus === 'interpreter_requested' && (
          <div
            role="status"
            className={`w-full p-4 rounded-2xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md transition-all ${
              escalationTriggered
                ? 'bg-amber-50 border-amber-500 text-amber-950 dark:bg-amber-950/40 dark:border-amber-500 dark:text-amber-100'
                : 'bg-indigo-50 border-indigo-400 text-indigo-950 dark:bg-indigo-950/40 dark:border-indigo-600 dark:text-indigo-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${escalationTriggered ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'}`}>
                {escalationTriggered ? <AlertTriangle className="w-5 h-5" /> : <Video className="w-5 h-5 animate-pulse" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded text-white ${escalationTriggered ? 'bg-amber-600' : 'bg-indigo-600'}`}>
                    {escalationTriggered ? 'Auto-Fallback Escalation' : 'Paging ISL Relay'}
                  </span>
                  {!escalationTriggered && countdownSeconds !== null && (
                    <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300">
                      Escalation in {countdownSeconds}s
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm sm:text-base mt-0.5">
                  {escalationTriggered
                    ? 'No remote interpreter accepted within 60s. Auto-fallback recommended.'
                    : 'Paging certified remote ISL interpreters. Standing by for connection...'}
                </h4>
                <p className="text-xs opacity-80">
                  {escalationTriggered
                    ? 'Recommend using the ISL Video Library (P2 AI Fallback) below to play pre-recorded sign clips on the patient tablet.'
                    : 'The patient screen will automatically connect into 2-party HD video when an interpreter accepts.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePageInterpreter}
                className="text-xs font-bold flex items-center gap-1 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Re-Page
              </Button>
            </div>
          </div>
        )}

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-3 sm:p-4">
              <span className="text-xs text-slate-500 font-medium">Session Status</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm sm:text-base font-bold capitalize text-slate-900 dark:text-white">
                  {sessionStatus.replace('_', ' ')}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-3 sm:p-4">
              <span className="text-xs text-slate-500 font-medium">Remote Interpreter</span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    sessionStatus === 'interpreter_connected'
                      ? 'bg-emerald-500'
                      : sessionStatus === 'interpreter_requested'
                      ? 'bg-amber-500 animate-ping'
                      : 'bg-slate-400'
                  }`}
                />
                <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {sessionStatus === 'interpreter_connected'
                    ? 'Connected'
                    : sessionStatus === 'interpreter_requested'
                    ? 'Paging...'
                    : 'Standby'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-3 sm:p-4">
              <span className="text-xs text-slate-500 font-medium">AI Fallback Library</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  48 ISL Clips Ready
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-3 sm:p-4">
              <span className="text-xs text-slate-500 font-medium">Audit Events Logged</span>
              <div className="flex items-center gap-2 mt-1">
                <FileText className="w-4 h-4 text-teal-600" />
                <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {events.length} Interactions
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two-Column Clinical Section: Left = Communication Console, Right = Live Transcript Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (7 cols): Clinician Communication Console */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-black text-[#084C5B] dark:text-teal-300 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-teal-600" />
                    Send ISL Video Signs to Patient
                  </CardTitle>
                  <span className="text-xs text-slate-500">P2 Assisted Communication</span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Dictate or type clinical message to match pre-recorded Indian Sign Language clip:
                  </span>
                  {isListening && (
                    <span className="text-xs font-bold text-red-600 animate-pulse flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
                      Listening to speech...
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  {isSupported && (
                    <Button
                      type="button"
                      variant={isListening ? 'destructive' : 'outline'}
                      size="icon"
                      onClick={handleToggleListening}
                      className="h-12 w-12 rounded-xl shrink-0"
                      aria-label={isListening ? 'Stop recording' : 'Start speech recognition'}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-[#084C5B]" />}
                    </Button>
                  )}

                  <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendISLPhrase()}
                    placeholder="Type or dictate: e.g. 'You are safe', 'Take this medicine'..."
                    className="h-12 text-base rounded-xl border-slate-300 dark:border-slate-700 flex-1"
                  />

                  <Button
                    onClick={() => handleSendISLPhrase()}
                    disabled={isSearching || !inputText.trim()}
                    className="h-12 px-5 bg-[#084C5B] hover:bg-[#0D748A] text-white rounded-xl shrink-0 font-bold"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Quick Action Chips */}
                <div>
                  <span className="text-xs font-semibold text-slate-500 block mb-2">
                    Quick Clinical Reassurances:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'You are safe', key: 'you-are-safe' },
                      { label: 'We are helping you', key: 'we-are-helping' },
                      { label: 'Take this medicine', key: 'take-medicine' },
                      { label: 'Stay still', key: 'stay-still' },
                      { label: 'Relax / breathe', key: 'relax' },
                      { label: 'Do you agree?', key: 'do-you-agree' },
                      { label: 'We need to do a test', key: 'need-to-do-test' },
                      { label: 'Do you have family here?', key: 'family-here' },
                    ].map((chip) => (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={() => handleSendISLPhrase(chip.label)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-teal-50 hover:text-[#084C5B] dark:hover:bg-teal-950/60 dark:hover:text-teal-200 border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        + {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Call Tile (When LiveKit is Connected) */}
            {sessionStatus === 'interpreter_connected' && (
              <Card className="bg-indigo-950 text-white border-2 border-indigo-500 overflow-hidden shadow-xl">
                <CardHeader className="p-4 bg-indigo-900 border-b border-indigo-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-indigo-300 animate-pulse" />
                      <CardTitle className="text-base font-bold">
                        Live ISL Interpreter Relay Active
                      </CardTitle>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-600 text-white font-bold uppercase">
                      2-Party Video Live
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-indigo-200">
                    Patient and remote certified interpreter are connected in a private LiveKit session.
                  </p>
                  <Button
                    onClick={() => window.open(`/interpreter/call/${sessionId}`, '_blank')}
                    className="bg-white text-indigo-950 hover:bg-indigo-100 font-bold shrink-0"
                  >
                    Open Call Stream
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column (5 cols): Live Audit Trail / Transcript Feed */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#084C5B]" />
                    Live Interaction Audit Trail
                  </CardTitle>
                  <span className="text-xs text-slate-400">
                    {events.length} events
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-1 overflow-y-auto max-h-[600px]">
                <TranscriptFeed events={events} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bedside Tablet QR Pairing Modal */}
      <Dialog open={pairingOpen} onOpenChange={setPairingOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-2 border-[#084C5B] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#084C5B] dark:text-teal-400" />
              Bedside Tablet Pairing
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Scan with an iPad, Android tablet, or smartphone camera to launch this patient&apos;s bedside kiosk.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(tabletUrl)}`}
                alt="Bedside Pairing QR Code"
                width={200}
                height={200}
                className="rounded-lg"
              />
            </div>
            <p className="text-[11px] font-mono bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded text-slate-700 dark:text-slate-300 break-all select-all text-center">
              {tabletUrl}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={handleCopyTabletUrl}
              variant="outline"
              className="flex-1 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copiedUrl ? 'Copied!' : 'Copy Link'}
            </Button>
            <Button
              onClick={() => window.open(tabletUrl, '_blank')}
              className="flex-1 bg-[#084C5B] hover:bg-[#0D748A] text-white text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              Open Tablet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
