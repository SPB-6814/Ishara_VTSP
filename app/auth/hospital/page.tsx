'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Stethoscope, ArrowLeft, Mail, CheckCircle2, Zap } from 'lucide-react'
import { toast } from 'sonner'

export default function HospitalAuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sentMagicLink, setSentMagicLink] = useState(false)

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      // In DEMO_MODE or without Supabase auth configured, simulate magic link
      setTimeout(() => {
        setLoading(false)
        setSentMagicLink(true)
        toast.success('Magic link sent to ' + email)
      }, 800)
    } catch {
      setLoading(false)
      toast.error('Failed to send magic link')
    }
  }

  const handleQuickDemoLogin = (role: 'doctor' | 'nurse') => {
    toast.success(`Logged in as Demo ${role === 'doctor' ? 'Doctor' : 'Staff'}`)
    router.push('/dashboard/demo-session')
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Portal Selector
        </Link>

        <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="bg-teal-50/50 dark:bg-teal-950/20 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-[#084C5B] text-white flex items-center justify-center mb-2 shadow">
              <Stethoscope className="w-5 h-5" />
            </div>
            <CardTitle className="text-xl font-black text-slate-900 dark:text-white">
              Hospital Staff Portal
            </CardTitle>
            <p className="text-xs text-slate-500">
              Sign in with your hospital email to monitor patient sessions.
            </p>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {sentMagicLink ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-950 text-sm">Check Your Inbox</h4>
                <p className="text-xs text-emerald-800">
                  We sent a magic sign-in link to <b>{email}</b>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Hospital Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <Input
                      type="email"
                      required
                      placeholder="doctor@hospital.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-11 rounded-xl"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-[#084C5B] hover:bg-[#0D748A] text-white font-bold"
                >
                  {loading ? 'Sending link...' : 'Send Magic Link'}
                </Button>
              </form>
            )}

            {/* Quick Demo Bypass */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" /> Demo Mode One-Click Login
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleQuickDemoLogin('doctor')}
                  className="h-10 text-xs font-bold rounded-xl hover:bg-teal-50 hover:text-[#084C5B]"
                >
                  Demo Doctor
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleQuickDemoLogin('nurse')}
                  className="h-10 text-xs font-bold rounded-xl hover:bg-teal-50 hover:text-[#084C5B]"
                >
                  Demo Nurse
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
