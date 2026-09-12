import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { toValidSessionUuid, getSessionChannel, REALTIME_EVENTS } from '@/lib/realtime'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, activeMode, interpreterId } = body
    const validUuid = toValidSessionUuid(id)

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createServiceClient()
        const updateData: any = {}
        if (status) updateData.status = status
        if (activeMode) updateData.active_mode = activeMode
        if (interpreterId) updateData.assigned_interpreter_id = interpreterId
        if (status === 'closed') updateData.closed_at = new Date().toISOString()

        await supabase.from('sessions').update(updateData).eq('id', validUuid)

        // Broadcast to Realtime channel for session
        if (status) {
          const channel = supabase.channel(getSessionChannel(id))
          channel.subscribe((subStatus) => {
            if (subStatus === 'SUBSCRIBED') {
              channel.send({
                type: 'broadcast',
                event: REALTIME_EVENTS.STATUS_CHANGE,
                payload: {
                  type: 'status_change',
                  sessionId: id,
                  newStatus: status,
                  timestamp: new Date().toISOString(),
                },
              })
            }
          })
        }
      } catch (err) {
        console.warn('DB session status update error:', err)
      }
    }

    return NextResponse.json({
      success: true,
      sessionId: id,
      status,
      activeMode,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
