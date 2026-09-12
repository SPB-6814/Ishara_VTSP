import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))

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
          .eq('id', id)

        await supabase.from('session_events').insert({
          session_id: id,
          event_type: 'interpreter_requested',
          payload: {
            requestedAt: new Date().toISOString(),
            note: body.note || 'Urgent clinician bedside request',
          },
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
