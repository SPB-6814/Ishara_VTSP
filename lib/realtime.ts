/**
 * Realtime channel naming conventions and helpers for Ishara.
 *
 * Channels:
 * - session:{sessionId}       — intra-session events (pictogram, clip play, status, gesture)
 * - interpreter-requests      — global interpreter request broadcast
 * - interpreter-presence      — presence tracking for online interpreters
 */

/** Get the Realtime channel name for a session */
export function getSessionChannel(sessionId: string) {
  return `session:${sessionId}`
}

/** Global channel for broadcasting interpreter requests */
export const INTERPRETER_REQUESTS_CHANNEL = 'interpreter-requests'

/** Presence channel for interpreter online/offline tracking */
export const INTERPRETER_PRESENCE_CHANNEL = 'interpreter-presence'

/** Realtime event names */
export const REALTIME_EVENTS = {
  PICTOGRAM_ALERT: 'pictogram_alert',
  PLAY_CLIP: 'play_clip',
  STATUS_CHANGE: 'status_change',
  GESTURE_TEXT: 'gesture_text',
  NEW_REQUEST: 'new_request',
} as const
