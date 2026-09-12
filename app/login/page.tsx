'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Stethoscope,
  Video,
  Tablet,
  ArrowRight,
  Zap,
} from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isCreatingSession, setIsCreatingSession] = useState(false)

  const handleStartDemoSession = async (role: 'patient' | 'staff') => {
    setIsCreatingSession(true)
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientDisplayName: 'Patient Bed 4A (Ramesh)',
        }),
      })
      const data = await res.json()
      const sessionId = data.session?.id || 'demo-session'

      if (role === 'patient') {
        router.push(`/patient/${sessionId}`)
      } else {
        router.push(`/dashboard/${sessionId}`)
      }
    } catch {
      router.push(role === 'patient' ? '/patient/demo-session' : '/dashboard/demo-session')
    } finally {
      setIsCreatingSession(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-4xl space-y-8 my-8">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 shadow-sm mb-2">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16">
              <Image
                src="/logo.png"
                alt="Ishara Logo"
                fill
                sizes="64px"
                className="object-contain"
                priority
              />
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#084C5B] dark:text-teal-300">
            Ishara • इशारा
          </h1>
          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-xl mx-auto font-medium">
            Clinical Communication Platform for Deaf & Mute Indian Sign Language Patients
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
              🚨 P0 Pictogram Grid
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              🎥 P1 Live ISL Interpreter Call
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              🤖 P2 AI Sign Video Fallback
            </span>
          </div>
        </div>

        {/* The Two Portals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Portal 1: Hospital */}
          <Link href="/auth/hospital" className="block group">
            <Card className="h-full border-2 border-slate-200 dark:border-slate-800 group-hover:border-[#084C5B] transition-all duration-200 shadow-sm group-hover:shadow-xl rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="pb-3 bg-teal-50/50 dark:bg-teal-950/20 border-b border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-[#084C5B] text-white flex items-center justify-center mb-2 shadow">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  I&apos;m with a Hospital
                </CardTitle>
                <p className="text-xs text-slate-500 font-medium">
                  Doctors, Triage Nurses, and Clinical Staff
                </p>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Access patient monitoring, receive instant pictogram triage alerts, voice-dictate ISL video clips, and page remote interpreters.
                </p>
                <div className="flex items-center text-sm font-bold text-[#084C5B] dark:text-teal-400 group-hover:translate-x-1 transition-transform">
                  Enter Hospital Portal <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Portal 2: Interpreter */}
          <Link href="/auth/interpreter" className="block group">
            <Card className="h-full border-2 border-slate-200 dark:border-slate-800 group-hover:border-[#4F46E5] transition-all duration-200 shadow-sm group-hover:shadow-xl rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="pb-3 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center mb-2 shadow">
                  <Video className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  I&apos;m an ISL Interpreter
                </CardTitle>
                <p className="text-xs text-slate-500 font-medium">
                  Certified Remote Sign Language Interpreters
                </p>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Join the on-demand translation pool, toggle availability, receive emergency hospital call requests, and connect over 2-party WebRTC video.
                </p>
                <div className="flex items-center text-sm font-bold text-[#4F46E5] dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                  Enter Interpreter Dashboard <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Live Hackathon Demo Shortcuts */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-teal-300 dark:border-teal-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#084C5B] dark:text-teal-300">
                Hackathon Live Demo Launcher (DEMO_MODE)
              </h2>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              Bypass Auth Active
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            For judges and multi-device evaluation: open these links on your tablet and laptop to experience the full triage loop in real time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              onClick={() => handleStartDemoSession('patient')}
              disabled={isCreatingSession}
              className="bg-[#084C5B] hover:bg-[#0D748A] text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2 shadow"
            >
              <Tablet className="w-4 h-4" />
              1. Open Patient Tablet Kiosk
            </Button>

            <Button
              onClick={() => handleStartDemoSession('staff')}
              disabled={isCreatingSession}
              variant="outline"
              className="border-slate-300 dark:border-slate-700 hover:bg-slate-100 font-bold h-12 rounded-xl flex items-center justify-center gap-2"
            >
              <Stethoscope className="w-4 h-4 text-[#084C5B]" />
              2. Open Staff Station
            </Button>

            <Button
              onClick={() => router.push('/interpreter/dashboard')}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2 shadow"
            >
              <Video className="w-4 h-4" />
              3. Open Interpreter Portal
            </Button>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-slate-400 font-medium">
          Ishara Clinical Communication • Built with Next.js 15, Supabase, LiveKit & Bun
        </p>
      </div>
    </main>
  )
}
