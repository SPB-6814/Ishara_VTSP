'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Stethoscope,
  Video,
  Tablet,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [bedSessionId, setBedSessionId] = useState('')

  const handleOpenBedsideTablet = (e: React.FormEvent) => {
    e.preventDefault()
    const targetSession = bedSessionId.trim() || '00000000-0000-0000-0000-000000000001'
    router.push(`/patient/${targetSession}`)
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
        </div>

        {/* The Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Portal 1: Hospital Doctor Staff */}
          <Link href="/auth/hospital" className="block group">
            <Card className="h-full border-2 border-slate-200 dark:border-slate-800 group-hover:border-[#084C5B] transition-all duration-200 shadow-sm group-hover:shadow-xl rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="pb-3 bg-teal-50/50 dark:bg-teal-950/20 border-b border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-[#084C5B] text-white flex items-center justify-center mb-2 shadow">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Hospital Staff Portal
                </CardTitle>
                <p className="text-xs text-slate-500 font-medium">
                  Doctors, Triage Specialists, and Medical Staff
                </p>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Access the Bedside Triage Roster, receive zero-latency emergency pictogram alerts, dictate voice-to-sign instructions, and page remote interpreters.
                </p>
                <div className="flex items-center text-sm font-bold text-[#084C5B] dark:text-teal-400 group-hover:translate-x-1 transition-transform">
                  Enter Hospital Station <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Portal 2: Certified ISL Interpreter */}
          <Link href="/auth/interpreter" className="block group">
            <Card className="h-full border-2 border-slate-200 dark:border-slate-800 group-hover:border-[#4F46E5] transition-all duration-200 shadow-sm group-hover:shadow-xl rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="pb-3 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center mb-2 shadow">
                  <Video className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  ISL Interpreter Portal
                </CardTitle>
                <p className="text-xs text-slate-500 font-medium">
                  Certified Remote Sign Language Interpreters
                </p>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Manage on-demand hospital availability, receive real-time incoming emergency calls with ring alarms, and connect over 2-party HD WebRTC video.
                </p>
                <div className="flex items-center text-sm font-bold text-[#4F46E5] dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                  Enter Interpreter Dashboard <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Portal 3: Bedside Tablet Kiosk Quick Entry */}
        <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-md rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-300 shrink-0">
                <Tablet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Bedside Patient Tablet Kiosk
                </h3>
                <p className="text-xs text-slate-500">
                  Tablets at the bedside are paired via doctor QR codes, or can be opened directly below:
                </p>
              </div>
            </div>

            <form onSubmit={handleOpenBedsideTablet} className="w-full sm:w-auto flex items-center gap-2">
              <Input
                placeholder="Session ID or Bed 4A"
                value={bedSessionId}
                onChange={(e) => setBedSessionId(e.target.value)}
                className="h-10 text-xs w-full sm:w-52 rounded-xl"
              />
              <Button
                type="submit"
                className="bg-[#084C5B] hover:bg-[#0D748A] text-white font-bold text-xs h-10 px-4 rounded-xl shrink-0 flex items-center gap-1.5"
              >
                <span>Launch Tablet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Evaluation Credentials Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-50 to-indigo-50 dark:from-teal-950/40 dark:to-indigo-950/40 border border-teal-200 dark:border-teal-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-700 dark:text-teal-300" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Evaluation & Judge Credentials (Pre-Seeded)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-teal-200 dark:border-teal-800/60">
              <span className="font-bold text-[#084C5B] dark:text-teal-300 block mb-0.5">
                Hospital Doctor Account:
              </span>
              <p className="text-slate-600 dark:text-slate-300 font-mono">
                Email: <b>dr.sharma@apollo.health</b>
              </p>
              <p className="text-slate-600 dark:text-slate-300 font-mono">
                Password: <b>Ishara2026!</b>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-indigo-200 dark:border-indigo-800/60">
              <span className="font-bold text-[#4F46E5] dark:text-indigo-300 block mb-0.5">
                ISL Interpreter Account:
              </span>
              <p className="text-slate-600 dark:text-slate-300 font-mono">
                Email: <b>ananya.isl@relay.org</b>
              </p>
              <p className="text-slate-600 dark:text-slate-300 font-mono">
                Password: <b>Ishara2026!</b>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 font-medium">
          Ishara Clinical Communication Platform • Enterprise Production Architecture
        </p>
      </div>
    </main>
  )
}
