'use client'

/**
 * components/transcript-feed.EXTEND.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * ADD the gesture_text case to your existing transcript-feed.tsx.
 *
 * INSTRUCTIONS:
 *  1. Find the block where you render different event types (likely a switch or
 *     a series of if blocks based on item.type or event type).
 *  2. Add the GestureTextEntry component below and the 'gesture_text' case.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { GestureTextPayload } from '@/hooks/use-session-realtime'

// ── ADD: Gesture badge sub-component ─────────────────────────────────────────
// Drop this component into transcript-feed.tsx (or a separate file if you prefer)

interface GestureTextEntryProps {
  payload: GestureTextPayload
}

export function GestureTextEntry({ payload }: GestureTextEntryProps) {
  const confidencePct = Math.round(payload.confidence * 100)
  const time = new Date(payload.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  // Colour-code by confidence
  const confColor =
    confidencePct >= 80
      ? 'text-green-400 bg-green-500/10 border-green-500/30'
      : confidencePct >= 60
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : 'text-gray-400 bg-gray-500/10 border-gray-500/30'

  return (
    <div className="flex items-start gap-3 py-2 px-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
      {/* ISL icon badge */}
      <div className="flex-shrink-0 mt-0.5">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-500/15 text-purple-300 text-xs font-bold">
          ISL
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium leading-snug">
          {payload.text}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {/* Confidence pill */}
          <span className={`text-xs px-1.5 py-0.5 rounded border font-mono ${confColor}`}>
            {confidencePct}% confidence
          </span>
          {/* Timestamp */}
          <span className="text-xs text-gray-500">{time}</span>
          {/* AI-detected label */}
          <span className="text-xs text-purple-400 opacity-70">AI-detected sign</span>
        </div>
      </div>
    </div>
  )
}

// ── ADD: case in your existing render switch/map ───────────────────────────────
//
// Find where your transcript-feed maps over transcript items and renders them.
// Add this case alongside existing ones:
//
//   // If you have a switch on item.type:
//   case 'gesture_text':
//     return <GestureTextEntry key={item.id ?? item.timestamp} payload={item.payload} />
//
//   // If you have if/else blocks:
//   if (item.type === 'gesture_text') {
//     return <GestureTextEntry key={item.id ?? item.timestamp} payload={item.payload} />
//   }
//
// Make sure your transcript item type union includes gesture_text:
//
//   type TranscriptItem =
//     | { type: 'message'; ... }
//     | { type: 'gesture_text'; payload: GestureTextPayload; id?: string }  // ← ADD
//     | ...existing types
