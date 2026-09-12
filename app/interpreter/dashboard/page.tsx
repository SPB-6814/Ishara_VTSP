'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Clock,
  Building,
  PhoneCall,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { INTERPRETER_REQUESTS_CHANNEL, REALTIME_EVENTS } from '@/lib/realtime'
import { createClient } from '@/lib/supabase/client'

interface IncomingRequest {
  id: string
  sessionId: string
  hospitalName: string
  patientName: string
  requestedAt: string
}

export default function InterpreterDashboard() {
  const router = useRouter()
  const [status, setStatus] = useState<'available' | 'busy' | 'offline'>('available')
  const [requests, setRequests] = useState<IncomingRequest[]>([])

  const handleNewRequest = React.useCallback((payload: any) => {
    const req: IncomingRequest = {
      id: `req-${Date.now()}`,
      sessionId: payload?.sessionId || 'demo-session',
      hospitalName: payload?.hospitalName || 'Ishara Demo Hospital',
      patientName: payload?.patientName || 'Bedside Patient (ISL)',
      requestedAt: new Date().toLocaleTimeString(),
    }

    setRequests((prev) => [req, ...prev])
    toast.error(`Incoming ISL Translation Call from ${req.hospitalName}!`, {
      duration: 10000,
    })
  }, [])

  useEffect(() => {
    // 1. Listen on local BroadcastChannel
    let bc: BroadcastChannel | null = null
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('ishara_global_interpreter_requests')
        bc.onmessage = (event) => {
          if (event.data?.type === 'new_request') {
            handleNewRequest(event.data.payload)
          }
        }
      }
    } catch {}

    // 2. Listen on Supabase Realtime channel
    let supabase: any = null
    let channel: any = null

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        supabase = createClient()
        channel = supabase.channel(INTERPRETER_REQUESTS_CHANNEL)
        channel
          .on('broadcast', { event: REALTIME_EVENTS.NEW_REQUEST }, (response: any) => {
            handleNewRequest(response.payload)
          })
          .subscribe()
      }
    } catch {}

    return () => {
      if (bc) bc.close()
      if (channel && supabase) supabase.removeChannel(channel)
    }
  }, [handleNewRequest])

  // Pre-seed a demo request so judges can immediately test the "Accept" flow!
  useEffect(() => {
    const timer = setTimeout(() => {
      if (requests.length === 0) {
        setRequests([
          {
            id: 'req-demo-1',
            sessionId: 'demo-session',
            hospitalName: 'Ishara Demo Hospital (ICU Bed 4)',
            patientName: 'Ramesh (Deaf/ISL Patient)',
            requestedAt: new Date().toLocaleTimeString(),
          },
        ])
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [requests.length])

  const handleAcceptCall = async (req: IncomingRequest) => {
    toast.success(`Connecting to ${req.patientName}...`)

    // Notify backend
    fetch(`/api/session/${req.sessionId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'interpreter_connected',
        activeMode: 'live_interpreter',
      }),
    }).catch(() => {})

    // Route to video call view
    router.push(`/interpreter/call/${req.sessionId}`)
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
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
                <h1 className="text-lg font-black text-[#4F46E5] dark:text-indigo-400">
                  Ishara Interpreter Portal
                </h1>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
                  Certified ISL Relay
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Remote Video Triage & Indian Sign Language Translation
              </p>
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">Status:</span>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setStatus('available')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                  status === 'available'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                ● Available
              </button>
              <button
                type="button"
                onClick={() => setStatus('busy')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                  status === 'busy'
                    ? 'bg-amber-500 text-white shadow'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Busy
              </button>
              <button
                type="button"
                onClick={() => setStatus('offline')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                  status === 'offline'
                    ? 'bg-slate-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Offline
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Availability Banner */}
        <div
          className={`p-4 rounded-2xl border-2 flex items-center justify-between ${
            status === 'available'
              ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
              : 'bg-slate-100 border-slate-300 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-4 w-4">
              {status === 'available' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-4 w-4 ${
                  status === 'available' ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
            </span>
            <div>
              <h3 className="text-base font-bold">
                {status === 'available'
                  ? 'Active in Interpreter Pool — Listening for Requests'
                  : status === 'busy'
                  ? 'Currently Busy in Consultation'
                  : 'You are currently offline'}
              </h3>
              <p className="text-xs opacity-80">
                Hospital emergency triage calls will ring here with audio-visual alerts.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNewRequest({})}
            className="border-slate-400 text-xs hidden sm:inline-flex"
          >
            Simulate Incoming Call
          </Button>
        </div>

        {/* Incoming Requests Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <Bell className="w-5 h-5 text-[#4F46E5]" />
              Incoming Patient Triage Requests
            </h2>
            <span className="text-xs font-mono bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 px-2.5 py-0.5 rounded-full font-bold">
              {requests.length} Pending
            </span>
          </div>

          {requests.length === 0 ? (
            <Card className="bg-white dark:bg-slate-900 border-dashed border-2 p-8 text-center">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                No active interpreter requests
              </p>
              <p className="text-xs text-slate-400 mt-1">
                When bedside staff requests an ISL interpreter, the card will appear here with an instant Accept button.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <Card
                  key={req.id}
                  className="bg-white dark:bg-slate-900 border-2 border-[#4F46E5] shadow-lg overflow-hidden animate-in slide-in-from-top-2"
                >
                  <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase bg-red-600 text-white tracking-wider animate-pulse">
                          Emergency Call
                        </span>
                        <span className="text-xs text-slate-400">{req.requestedAt}</span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        {req.patientName}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {req.hospitalName}
                        </span>
                        <span className="font-mono text-slate-400">
                          Session: {req.sessionId.slice(0, 8)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <Button
                        size="lg"
                        onClick={() => handleAcceptCall(req)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-6 rounded-xl text-base shadow-lg flex items-center gap-2 w-full sm:w-auto"
                      >
                        <PhoneCall className="w-5 h-5 animate-bounce" />
                        Accept Call & Join Video
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
