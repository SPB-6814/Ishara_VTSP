'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSessionChannel, REALTIME_EVENTS } from '@/lib/realtime'
import type {
  PictogramAlertPayload,
  PlayClipPayload,
  StatusChangePayload,
  SessionStatus,
  SessionEvent,
} from '@/lib/types'

interface UseSessionRealtimeOptions {
  sessionId: string
  onAlertReceived?: (alert: PictogramAlertPayload) => void
  onClipReceived?: (clip: PlayClipPayload) => void
  onStatusReceived?: (status: StatusChangePayload) => void
}

export function useSessionRealtime({
  sessionId,
  onAlertReceived,
  onClipReceived,
  onStatusReceived,
}: UseSessionRealtimeOptions) {
  const [activeAlert, setActiveAlert] = useState<PictogramAlertPayload | null>(null)
  const [activeClip, setActiveClip] = useState<PlayClipPayload | null>(null)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('active')
  const [events, setEvents] = useState<SessionEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null)
  const supabaseChannelRef = useRef<any>(null)

  const handleIncomingEvent = useCallback(
    (type: string, payload: any) => {
      if (!payload) return

      if (type === REALTIME_EVENTS.PICTOGRAM_ALERT) {
        const alertData = payload as PictogramAlertPayload
        setActiveAlert(alertData)
        onAlertReceived?.(alertData)

        // Append to audit trail
        setEvents((prev) => [
          {
            id: `evt-${Date.now()}-${Math.random()}`,
            session_id: sessionId,
            event_type: 'pictogram',
            payload: alertData as unknown as Record<string, unknown>,
            actor_id: null,
            created_at: alertData.timestamp || new Date().toISOString(),
          },
          ...prev,
        ])
      } else if (type === REALTIME_EVENTS.PLAY_CLIP) {
        const clipData = payload as PlayClipPayload
        setActiveClip(clipData)
        onClipReceived?.(clipData)

        setEvents((prev) => [
          {
            id: `evt-${Date.now()}-${Math.random()}`,
            session_id: sessionId,
            event_type: 'isl_played',
            payload: clipData as unknown as Record<string, unknown>,
            actor_id: null,
            created_at: clipData.timestamp || new Date().toISOString(),
          },
          ...prev,
        ])
      } else if (type === REALTIME_EVENTS.STATUS_CHANGE) {
        const statusData = payload as StatusChangePayload
        setSessionStatus(statusData.newStatus)
        onStatusReceived?.(statusData)

        setEvents((prev) => [
          {
            id: `evt-${Date.now()}-${Math.random()}`,
            session_id: sessionId,
            event_type: 'note',
            payload: { message: `Status changed to ${statusData.newStatus}` },
            actor_id: null,
            created_at: statusData.timestamp || new Date().toISOString(),
          },
          ...prev,
        ])
      }
    },
    [sessionId, onAlertReceived, onClipReceived, onStatusReceived]
  )

  useEffect(() => {
    if (!sessionId) return

    // 1. Setup local BroadcastChannel for zero-latency local / same-machine multi-tab demo
    let localBC: BroadcastChannel | null = null
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        localBC = new BroadcastChannel(`ishara_session_${sessionId}`)
        broadcastChannelRef.current = localBC

        localBC.onmessage = (event) => {
          const { type, payload } = event.data || {}
          handleIncomingEvent(type, payload)
        }
      }
    } catch {
      // Ignore broadcast channel errors
    }

    // 2. Setup Supabase Realtime Channel
    let supabase: any = null
    let channel: any = null

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (supabaseUrl && supabaseUrl !== 'undefined') {
        supabase = createClient()
        const channelName = getSessionChannel(sessionId)

        channel = supabase.channel(channelName, {
          config: { broadcast: { self: false } },
        })

        channel
          .on('broadcast', { event: REALTIME_EVENTS.PICTOGRAM_ALERT }, (response: any) => {
            handleIncomingEvent(REALTIME_EVENTS.PICTOGRAM_ALERT, response.payload)
          })
          .on('broadcast', { event: REALTIME_EVENTS.PLAY_CLIP }, (response: any) => {
            handleIncomingEvent(REALTIME_EVENTS.PLAY_CLIP, response.payload)
          })
          .on('broadcast', { event: REALTIME_EVENTS.STATUS_CHANGE }, (response: any) => {
            handleIncomingEvent(REALTIME_EVENTS.STATUS_CHANGE, response.payload)
          })
          .subscribe((status: string) => {
            setIsConnected(status === 'SUBSCRIBED')
          })

        supabaseChannelRef.current = channel
      } else {
        // Fallback: local broadcast is active
        setIsConnected(true)
      }
    } catch (e) {
      console.warn('Realtime subscription fallback to local:', e)
      setIsConnected(true)
    }

    return () => {
      if (localBC) localBC.close()
      if (channel && supabase) {
        supabase.removeChannel(channel)
      }
    }
  }, [sessionId, handleIncomingEvent])

  /** Broadcast a pictogram tap event */
  const sendPictogramAlert = useCallback(
    (clipKey: string, label: string, category = 'Emergency') => {
      const payload: PictogramAlertPayload = {
        type: 'pictogram_alert',
        sessionId,
        clipKey,
        label,
        category,
        timestamp: new Date().toISOString(),
      }

      // 1. Post to local broadcast channel
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: REALTIME_EVENTS.PICTOGRAM_ALERT,
          payload,
        })
      }

      // 2. Post to Supabase Realtime channel
      if (supabaseChannelRef.current) {
        supabaseChannelRef.current.send({
          type: 'broadcast',
          event: REALTIME_EVENTS.PICTOGRAM_ALERT,
          payload,
        })
      }

      // Update local state
      setActiveAlert(payload)
      setEvents((prev) => [
        {
          id: `evt-${Date.now()}`,
          session_id: sessionId,
          event_type: 'pictogram',
          payload: payload as unknown as Record<string, unknown>,
          actor_id: null,
          created_at: payload.timestamp,
        },
        ...prev,
      ])

      // Asynchronous API call to persist in database without blocking UI
      fetch(`/api/patient/${sessionId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'pictogram',
          payload,
        }),
      }).catch(() => {})
    },
    [sessionId]
  )

  /** Broadcast an ISL video clip to play on patient tablet */
  const sendPlayClip = useCallback(
    (clipKey: string, clipUrl: string, label: string) => {
      const payload: PlayClipPayload = {
        type: 'play_clip',
        sessionId,
        clipKey,
        clipUrl,
        label,
        timestamp: new Date().toISOString(),
      }

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: REALTIME_EVENTS.PLAY_CLIP,
          payload,
        })
      }

      if (supabaseChannelRef.current) {
        supabaseChannelRef.current.send({
          type: 'broadcast',
          event: REALTIME_EVENTS.PLAY_CLIP,
          payload,
        })
      }

      setActiveClip(payload)
      setEvents((prev) => [
        {
          id: `evt-${Date.now()}`,
          session_id: sessionId,
          event_type: 'isl_played',
          payload: payload as unknown as Record<string, unknown>,
          actor_id: null,
          created_at: payload.timestamp,
        },
        ...prev,
      ])
    },
    [sessionId]
  )

  /** Update session status */
  const sendStatusChange = useCallback(
    (newStatus: SessionStatus) => {
      const payload: StatusChangePayload = {
        type: 'status_change',
        sessionId,
        newStatus,
        timestamp: new Date().toISOString(),
      }

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: REALTIME_EVENTS.STATUS_CHANGE,
          payload,
        })
      }

      if (supabaseChannelRef.current) {
        supabaseChannelRef.current.send({
          type: 'broadcast',
          event: REALTIME_EVENTS.STATUS_CHANGE,
          payload,
        })
      }

      setSessionStatus(newStatus)
    },
    [sessionId]
  )

  const clearAlert = useCallback(() => {
    setActiveAlert(null)
  }, [])

  const clearClip = useCallback(() => {
    setActiveClip(null)
  }, [])

  return {
    activeAlert,
    activeClip,
    sessionStatus,
    events,
    isConnected,
    sendPictogramAlert,
    sendPlayClip,
    sendStatusChange,
    clearAlert,
    clearClip,
    setEvents,
  }
}
