'use client'

import React from 'react'
import type { SessionEvent } from '@/lib/types'
import type { GestureTextPayload } from '@/hooks/use-session-realtime'
import {
  AlertCircle,
  Video,
  PlayCircle,
  MessageSquare,
  Clock,
} from 'lucide-react'

interface TranscriptFeedProps {
  events: SessionEvent[]
}

// ─── Gesture text sub-component ──────────────────────────────────────────────

function GestureTextEntry({ payload }: { payload: GestureTextPayload }) {
  const confidencePct = Math.round(payload.confidence * 100)
  const time = new Date(payload.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const confColor =
    confidencePct >= 80
      ? 'text-green-400 bg-green-500/10 border-green-500/30'
      : confidencePct >= 60
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : 'text-gray-400 bg-gray-500/10 border-gray-500/30'

  return (
    <div className="flex items-start gap-3 py-2 px-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
      <div className="flex-shrink-0 mt-0.5">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-500/15 text-purple-300 text-xs font-bold">
          ISL
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium leading-snug">{payload.text}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs px-1.5 py-0.5 rounded border font-mono ${confColor}`}>
            {confidencePct}% confidence
          </span>
          <span className="text-xs text-gray-500">{time}</span>
          <span className="text-xs text-purple-400 opacity-70">AI-detected sign</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TranscriptFeed({ events }: TranscriptFeedProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
        <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          No events in this session yet
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Patient pictogram taps, clip plays, and interpreter interactions will appear here in real time.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {events.map((evt) => {
        const payload = evt.payload as Record<string, any> || {}
        const time = evt.created_at ? new Date(evt.created_at).toLocaleTimeString() : ''

        switch (evt.event_type) {
          case 'pictogram':
            return (
              <div
                key={evt.id}
                className="p-3.5 rounded-xl border-l-4 border-l-red-600 bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 flex items-start justify-between gap-2 shadow-sm"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/60 px-1.5 py-0.5 rounded">
                        Patient Alert
                      </span>
                      <span className="text-xs text-slate-500">{time}</span>
                    </div>
                    <div className="font-extrabold text-base text-slate-900 dark:text-white mt-0.5">
                      {payload.label || payload.clipKey || 'Emergency Alert'}
                    </div>
                    {payload.extraNote && (
                      <p className="text-xs font-semibold text-red-800 dark:text-red-200 mt-0.5">
                        {payload.extraNote}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )

          case 'isl_played':
            return (
              <div
                key={evt.id}
                className="p-3.5 rounded-xl border-l-4 border-l-teal-600 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/40 flex items-start justify-between gap-2 shadow-sm"
              >
                <div className="flex items-start gap-2.5">
                  <PlayCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/60 px-1.5 py-0.5 rounded">
                        ISL Video Played
                      </span>
                      <span className="text-xs text-slate-500">{time}</span>
                    </div>
                    <div className="font-bold text-base text-slate-900 dark:text-white mt-0.5">
                      &ldquo;{payload.label || payload.clipKey}&rdquo;
                    </div>
                  </div>
                </div>
              </div>
            )

          case 'interpreter_requested':
          case 'interpreter_joined':
          case 'interpreter_left':
            return (
              <div
                key={evt.id}
                className="p-3 rounded-xl border-l-4 border-l-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Video className="w-5 h-5 text-indigo-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-indigo-800 dark:text-indigo-200">
                      {evt.event_type === 'interpreter_requested' && 'Remote ISL Interpreter Requested'}
                      {evt.event_type === 'interpreter_joined' && 'Interpreter Connected via WebRTC'}
                      {evt.event_type === 'interpreter_left' && 'Interpreter Left Session'}
                    </span>
                    {payload.message && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">{payload.message}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-500">{time}</span>
              </div>
            )

          case 'gesture_text':
            return (
              <GestureTextEntry
                key={evt.id}
                payload={evt.payload as unknown as GestureTextPayload}
              />
            )

          default:
            return (
              <div
                key={evt.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span>{payload.message || JSON.stringify(payload)}</span>
                </div>
                <span className="text-slate-400 text-[11px]">{time}</span>
              </div>
            )
        }
      })}
    </div>
  )
}
