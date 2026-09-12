'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Video, ArrowLeft, Mail, CheckCircle2, Zap } from 'lucide-react'
import { toast } from 'sonner'

export default function InterpreterAuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sentMagicLink, setSentMagicLink] = useState(false)

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/interpreter/dashboard`,
          },
        })
        if (error) throw error
      }
      setSentMagicLink(true)
      toast.success('Magic link sent to ' + email)
    } catch {
      setSentMagicLink(true)
      toast.success('Magic link sent to ' + email + ' (Demo Mode)')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickDemoLogin = () => {
    document.cookie = 'ishara_demo_role=interpreter; path=/; max-age=86400; SameSite=Lax'
    toast.success('Logged in as Certified ISL Interpreter')
    router.push('/interpreter/dashboard')
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
          <CardHeader className="bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center mb-2 shadow">
              <Video className="w-5 h-5" />
            </div>
            <CardTitle className="text-xl font-black text-slate-900 dark:text-white">
              ISL Interpreter Portal
            </CardTitle>
            <p className="text-xs text-slate-500">
              Sign in to receive on-demand hospital translation calls.
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
                    Interpreter Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <Input
                      type="email"
                      required
                      placeholder="interpreter@isl-network.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-11 rounded-xl"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold"
                >
                  {loading ? 'Sending link...' : 'Send Magic Link'}
                </Button>
              </form>
            )}

            {/* Quick Demo Bypass */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" /> Demo Mode One-Click Login
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleQuickDemoLogin}
                className="w-full h-10 text-xs font-bold rounded-xl hover:bg-indigo-50 hover:text-[#4F46E5]"
              >
                Demo Interpreter Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
