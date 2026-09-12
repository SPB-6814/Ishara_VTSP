'use client'

/**
 * app/dashboard/[sessionId]/page.EXTEND.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * ADD gesture recognition feedback to your existing doctor dashboard page.
 *
 * INSTRUCTIONS:
 *  1. Add onGestureReceived to your useSessionRealtime call
 *  2. Add gestureState to your component state
 *  3. Drop <GestureBanner> into your dashboard JSX
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback, useRef } from 'react'
import type { GestureTextPayload } from '@/hooks/use-session-realtime'

// ── SECTION 1: Add to your useSessionRealtime call ────────────────────────────
//
//   const { ...existing } = useSessionRealtime({
//     sessionId,
//     ...existing options...
//
//     onGestureReceived: handleGestureReceived,   // ← ADD
//   })

// ── SECTION 2: Add these state variables inside your dashboard component ───────
//
//   const [latestGesture, setLatestGesture]   = useState<GestureTextPayload | null>(null)
//   const [gestureBanner, setGestureBanner]   = useState(false)
//   const [autoSpeak,     setAutoSpeak]       = useState(true)
//   const [gestureHistory, setGestureHistory] = useState<GestureTextPayload[]>([])
//   const bannerTimerRef = useRef<ReturnType<typeof setTimeout>>()

// ── SECTION 3: Add the handler (inside your component, before return) ──────────
//
//   const handleGestureReceived = useCallback((payload: GestureTextPayload) => {
//     setLatestGesture(payload)
//     setGestureHistory(prev => [payload, ...prev].slice(0, 20))
//     setGestureBanner(true)
//
//     // Auto-clear banner after 5 seconds
//     if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current)
//     bannerTimerRef.current = setTimeout(() => setGestureBanner(false), 5000)
//
//     // Auto-speak
//     if (autoSpeak && typeof window !== 'undefined' && window.speechSynthesis) {
//       window.speechSynthesis.cancel()
//       const utt = new SpeechSynthesisUtterance(payload.text)
//       utt.rate  = 0.95
//       utt.pitch = 1
//       window.speechSynthesis.speak(utt)
//     }
//   }, [autoSpeak])

// ── SECTION 4: Add GestureBanner component ────────────────────────────────────
// Paste this component into your dashboard file and drop <GestureBanner /> in JSX

interface GestureBannerProps {
  latestGesture:  GestureTextPayload | null
  gestureHistory: GestureTextPayload[]
  visible:        boolean
  autoSpeak:      boolean
  onToggleAutoSpeak: (v: boolean) => void
  onDismiss:      () => void
  onSpeak:        (text: string) => void
}

export function GestureBanner({
  latestGesture,
  gestureHistory,
  visible,
  autoSpeak,
  onToggleAutoSpeak,
  onDismiss,
  onSpeak,
}: GestureBannerProps) {
  const [historyOpen, setHistoryOpen] = useState(false)

  if (!latestGesture) return null

  const isPainOrEmergency =
    latestGesture.text.toLowerCase().includes('pain') ||
    latestGesture.text.toLowerCase().includes('emergency') ||
    latestGesture.text.toLowerCase().includes('help')

  const isPositive =
    latestGesture.text.toLowerCase().includes('okay') ||
    latestGesture.text.toLowerCase().includes('yes') ||
    latestGesture.text.toLowerCase().includes('fine')

  const borderColor = isPainOrEmergency
    ? 'border-red-500 bg-red-500/5'
    : isPositive
    ? 'border-green-500 bg-green-500/5'
    : 'border-blue-500 bg-blue-500/5'

  const labelColor = isPainOrEmergency
    ? 'text-red-400'
    : isPositive
    ? 'text-green-400'
    : 'text-blue-400'

  const timeAgo = (() => {
    const secs = Math.round((Date.now() - latestGesture.timestamp) / 1000)
    if (secs < 5)  return 'just now'
    if (secs < 60) return `${secs}s ago`
    return `${Math.round(secs / 60)}m ago`
  })()

  return (
    <div
      className={`rounded-xl border-l-4 p-4 transition-all duration-300 ${borderColor} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'
      }`}
      role="alert"
      aria-live="assertive"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/15 text-purple-300 text-xs font-bold">
            ISL
          </span>
          <span className="text-xs text-gray-400">Patient signed</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Auto-speak toggle */}
          <button
            onClick={() => onToggleAutoSpeak(!autoSpeak)}
            className={`text-xs px-2 py-1 rounded-md border transition-colors ${
              autoSpeak
                ? 'border-blue-500/40 text-blue-400 bg-blue-500/10'
                : 'border-gray-600 text-gray-400 bg-transparent'
            }`}
            title={autoSpeak ? 'Auto-speak on' : 'Auto-speak off'}
          >
            {autoSpeak ? '🔊 Auto' : '🔇 Muted'}
          </button>

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Main gesture text */}
      <p className={`text-xl font-semibold mt-2 ${labelColor}`}>
        {latestGesture.text}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-3 mt-2">
        <span className="text-xs text-gray-400">
          {Math.round(latestGesture.confidence * 100)}% confidence
        </span>
        <span className="text-gray-600">·</span>
        <span className="text-xs text-gray-400">{timeAgo}</span>

        {/* Speak again button */}
        <button
          onClick={() => onSpeak(latestGesture.text)}
          className="ml-auto text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072M12 6a7.071 7.071 0 010 12M9 9.343a4 4 0 000 5.314"/>
          </svg>
          Speak again
        </button>
      </div>

      {/* History (collapsible) */}
      {gestureHistory.length > 1 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <button
            onClick={() => setHistoryOpen(o => !o)}
            className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            {historyOpen ? 'Hide' : 'Show'} history ({gestureHistory.length - 1} previous)
          </button>

          {historyOpen && (
            <ul className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {gestureHistory.slice(1).map((g, i) => (
                <li key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">{g.text}</span>
                  <span className="text-gray-500 ml-3 flex-shrink-0">
                    {new Date(g.timestamp).toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit', second: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ── SECTION 5: Wire it all up in your dashboard JSX ───────────────────────────
//
//   return (
//     <div className="...your layout...">
//
//       {/* ADD: Gesture banner at the top of the main content area */}
//       <GestureBanner
//         latestGesture={latestGesture}
//         gestureHistory={gestureHistory}
//         visible={gestureBanner}
//         autoSpeak={autoSpeak}
//         onToggleAutoSpeak={setAutoSpeak}
//         onDismiss={() => setGestureBanner(false)}
//         onSpeak={(text) => {
//           window.speechSynthesis.cancel()
//           window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
//         }}
//       />
//
//       {/* ...rest of your existing dashboard... */}
//     </div>
//   )
