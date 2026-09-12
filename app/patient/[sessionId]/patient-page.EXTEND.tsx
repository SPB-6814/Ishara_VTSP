'use client'

/**
 * app/patient/[sessionId]/page.EXTEND.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * ADD the camera card into your existing patient page.
 *
 * INSTRUCTIONS:
 *  1. Add the import at the top of your patient page file
 *  2. Pull sendGestureText from useSessionRealtime (it already returns this now)
 *  3. Add the cameraOpen state
 *  4. Drop <GestureCameraCard> into your JSX layout
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── SECTION 1: Add these imports to the top of your patient page ──────────────

import { useState } from 'react'
import { VisionGestureCamera } from '@/components/vision-gesture-camera'

// ── SECTION 2: Inside your component, after you call useSessionRealtime ────────
//
// Destructure sendGestureText from your existing hook call:
//
//   const {
//     ...whatever you already destructure...
//     sendGestureText,          // ← ADD THIS
//   } = useSessionRealtime({ sessionId, ... })
//
// Add collapse state:
//
//   const [cameraOpen, setCameraOpen] = useState(false)

// ── SECTION 3: Add this JSX card into your patient layout ─────────────────────
//
// Place it wherever makes sense in your layout — bedside card position,
// below the main content, or in a sidebar. Paste the JSX below as-is:

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
              d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"/>
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
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

// ── SECTION 4: In your patient page JSX, add the card ─────────────────────────
//
// Find a good spot in your return JSX (e.g. below the main chat/transcript area)
// and add:
//
//   <GestureCameraCard sendGestureText={sendGestureText} />
//
// Example placement:
//
//   return (
//     <div className="...your layout...">
//       {/* ...existing patient UI... */}
//
//       <GestureCameraCard sendGestureText={sendGestureText} />   {/* ← ADD */}
//     </div>
//   )

export { GestureCameraCard }
