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
  CANCEL_REQUEST: 'cancel_request',
} as const

/** Canonical fallback UUID for demo session in PostgreSQL */
export const DEMO_SESSION_UUID = '00000000-0000-0000-0000-000000000001'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Normalizes any session identifier (including slugs like 'demo-session')
 * into a valid UUID suitable for PostgreSQL uuid columns.
 */
export function toValidSessionUuid(id: string | undefined | null): string {
  if (!id) return DEMO_SESSION_UUID
  if (UUID_REGEX.test(id)) return id
  return DEMO_SESSION_UUID
}

