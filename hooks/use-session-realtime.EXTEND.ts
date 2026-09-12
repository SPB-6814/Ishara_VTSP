/**
 * hooks/use-session-realtime.EXTEND.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * ADD the following to your existing use-session-realtime.ts file.
 * Do NOT replace the whole file — only merge in the marked sections.
 *
 * INSTRUCTIONS:
 *  1. Find your REALTIME_EVENTS constant and add GESTURE_TEXT
 *  2. Add sendGestureText to your channel broadcast logic
 *  3. Add onGestureReceived to your event handler switch/if block
 *  4. Expose both in the hook's return value
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── SECTION 1 ─────────────────────────────────────────────────────────────────
// Find your REALTIME_EVENTS object (or enum) and ADD this entry:
// ─────────────────────────────────────────────────────────────────────────────
//
//  export const REALTIME_EVENTS = {
//    ...existing events...
//
//    GESTURE_TEXT: 'gesture_text',   // ← ADD THIS LINE
//  } as const

// ── SECTION 2 ─────────────────────────────────────────────────────────────────
// ADD this type alongside your existing payload types:
// ─────────────────────────────────────────────────────────────────────────────

export interface GestureTextPayload {
  text: string          // The detected gesture display text e.g. "Chest pain"
  confidence: number    // 0–1
  timestamp: number     // Date.now()
}

// ── SECTION 3 ─────────────────────────────────────────────────────────────────
// ADD onGestureReceived to your hook's props/options interface:
// ─────────────────────────────────────────────────────────────────────────────
//
//  interface UseSessionRealtimeOptions {
//    ...existing fields...
//    onGestureReceived?: (payload: GestureTextPayload) => void  // ← ADD
//  }

// ── SECTION 4 ─────────────────────────────────────────────────────────────────
// Inside your useSessionRealtime hook, where you subscribe to Supabase channel
// and handle incoming events, ADD the gesture_text case.
//
// If you use a switch statement it looks like this:
// ─────────────────────────────────────────────────────────────────────────────
//
//  channel.on('broadcast', { event: '*' }, ({ event, payload }) => {
//    switch (event) {
//      ...existing cases...
//
//      case REALTIME_EVENTS.GESTURE_TEXT:          // ← ADD THIS CASE
//        options.onGestureReceived?.(payload as GestureTextPayload)
//        break
//    }
//  })
//
// If you use if/else:
//
//  if (event === REALTIME_EVENTS.GESTURE_TEXT) {
//    options.onGestureReceived?.(payload as GestureTextPayload)
//  }

// ── SECTION 5 ─────────────────────────────────────────────────────────────────
// ADD sendGestureText function inside your hook body, using the same channel
// reference your hook already holds. Add it alongside your other send* functions:
// ─────────────────────────────────────────────────────────────────────────────

/*
  const sendGestureText = async (text: string, confidence: number) => {
    if (!channelRef.current) return   // ← use whatever your hook calls the channel ref
    const payload: GestureTextPayload = {
      text,
      confidence,
      timestamp: Date.now(),
    }
    await channelRef.current.send({
      type: 'broadcast',
      event: REALTIME_EVENTS.GESTURE_TEXT,
      payload,
    })
  }
*/

// ── SECTION 6 ─────────────────────────────────────────────────────────────────
// ADD sendGestureText to the hook's return object:
// ─────────────────────────────────────────────────────────────────────────────
//
//  return {
//    ...existing return values...
//    sendGestureText,    // ← ADD
//  }
