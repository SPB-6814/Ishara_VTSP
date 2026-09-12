import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { toValidSessionUuid } from '@/lib/realtime'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const body = await request.json()
    const { eventType, payload } = body
    const validUuid = toValidSessionUuid(sessionId)

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createServiceClient()
        const { error } = await supabase.from('session_events').insert({
          session_id: validUuid,
          event_type: eventType || 'pictogram',
          payload: payload || {},
        })

        if (!error) {
          return NextResponse.json({ success: true })
        }
      } catch (err) {
        console.warn('Patient event log error, fallback accepted:', err)
      }
    }

    return NextResponse.json({ success: true, local: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
