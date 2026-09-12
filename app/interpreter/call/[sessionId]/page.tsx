'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function InterpreterCallPage() {
  const params = useParams<{ sessionId: string }>()
  const router = useRouter()
  const sessionId = params.sessionId || 'demo-session'

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const [micEnabled, setMicEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [cameraActive, setCameraActive] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  // Start local camera feed
  useEffect(() => {
    let stream: MediaStream | null = null

    async function initCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
          setCameraActive(true)
        }
      } catch (err) {
        console.warn('Camera access fallback:', err)
      }
    }

    initCamera()

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)

    return () => {
      clearInterval(interval)
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const handleToggleMic = () => {
    setMicEnabled((prev) => !prev)
    toast.info(micEnabled ? 'Microphone muted' : 'Microphone unmuted')
  }

  const handleToggleVideo = () => {
    setVideoEnabled((prev) => !prev)
    toast.info(videoEnabled ? 'Camera paused' : 'Camera resumed')
  }

  const handleEndCall = () => {
    toast.success('Call ended. Returning to dashboard.')
    fetch(`/api/session/${sessionId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'active',
        activeMode: 'pictogram',
      }),
    }).catch(() => {})

    router.push('/interpreter/dashboard')
  }

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const s = sec % 60
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <main className="h-screen w-screen bg-slate-950 text-white flex flex-col overflow-hidden select-none">
      {/* Top Floating Bar */}
      <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 bg-black/70 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 pointer-events-auto">
          <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-teal-500/20 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Ishara Logo"
              fill
              sizes="28px"
              className="object-contain p-0.5"
            />
          </div>
          <div>
            <span className="text-xs font-bold text-teal-400 block leading-tight">
              ISL Live Triage Call
            </span>
            <span className="text-xs font-mono text-slate-300">
              Session: {sessionId.slice(0, 8)} • Bed 4A
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="bg-red-600/90 text-white font-mono text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white" />
            LIVE {formatDuration(callDuration)}
          </div>
        </div>
      </div>

      {/* Main Video View: Split-screen or Picture-in-Picture */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 p-2 sm:p-4 pt-16 sm:pt-20">
        {/* Remote Participant Tile (Patient Bedside Camera Feed) */}
        <div className="relative w-full h-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-24 h-24 rounded-full bg-teal-950 border-2 border-teal-500 flex items-center justify-center">
              <Users className="w-10 h-10 text-teal-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Patient Bedside (Ramesh)</h3>
              <p className="text-xs text-slate-400">ISL User • Doctor Present</p>
            </div>
            <span className="text-xs bg-teal-900/60 text-teal-300 px-3 py-1 rounded-full border border-teal-600/40">
              WebRTC Audio & Video Stream Synchronized
            </span>
          </div>

          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold">
            Patient Tablet Feed
          </div>
        </div>

        {/* Local Interpreter Camera Tile */}
        <div className="relative w-full h-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
          {cameraActive && videoEnabled ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <VideoOff className="w-12 h-12 text-slate-500" />
              <p className="text-xs text-slate-400">Camera preview off</p>
            </div>
          )}

          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            You (Certified ISL Interpreter)
          </div>
        </div>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="p-4 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handleToggleMic}
          className={`h-12 w-12 rounded-2xl border-slate-700 ${
            micEnabled ? 'bg-slate-800 text-white' : 'bg-red-600 text-white'
          }`}
          aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleToggleVideo}
          className={`h-12 w-12 rounded-2xl border-slate-700 ${
            videoEnabled ? 'bg-slate-800 text-white' : 'bg-red-600 text-white'
          }`}
          aria-label={videoEnabled ? 'Stop video' : 'Start video'}
        >
          {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>

        <Button
          onClick={handleEndCall}
          className="h-12 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 shadow-lg"
        >
          <PhoneOff className="w-5 h-5" />
          End Call
        </Button>
      </div>
    </main>
  )
}
