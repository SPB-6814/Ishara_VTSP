import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  toValidSessionUuid,
  INTERPRETER_REQUESTS_CHANNEL,
  REALTIME_EVENTS,
} from '@/lib/realtime'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const validUuid = toValidSessionUuid(id)

    // Update session status
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createServiceClient()
        await supabase
          .from('sessions')
          .update({
            status: 'interpreter_requested',
            active_mode: 'live_interpreter',
          })
          .eq('id', validUuid)

        await supabase.from('session_events').insert({
          session_id: validUuid,
          event_type: 'interpreter_requested',
          payload: {
            requestedAt: new Date().toISOString(),
            note: body.note || 'Urgent clinician bedside request',
          },
        })

        // Broadcast to Realtime interpreter-requests channel
        const interpChannel = supabase.channel(INTERPRETER_REQUESTS_CHANNEL)
        interpChannel.subscribe((subStatus) => {
          if (subStatus === 'SUBSCRIBED') {
            interpChannel.send({
              type: 'broadcast',
              event: REALTIME_EVENTS.NEW_REQUEST,
              payload: {
                id: `req-${Date.now()}`,
                sessionId: id,
                hospitalName: body.hospitalName || 'Ishara Demo Hospital',
                patientName: body.patientName || 'Bedside Patient (ISL)',
                note: body.note || 'Urgent clinician bedside request',
                requestedAt: new Date().toLocaleTimeString(),
              },
            })
          }
        })
      } catch (err) {
        console.warn('DB interpreter request error:', err)
      }
    }

    return NextResponse.json({
      success: true,
      sessionId: id,
      status: 'interpreter_requested',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
