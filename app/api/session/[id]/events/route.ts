import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { toValidSessionUuid } from '@/lib/realtime'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const validUuid = toValidSessionUuid(id)

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabase = await createClient()
        const { data, error } = await supabase
          .from('session_events')
          .select('*')
          .eq('session_id', validUuid)
          .order('created_at', { ascending: false })

        if (!error && data) {
          return NextResponse.json({ events: data })
        }
      } catch {}
    }

    return NextResponse.json({ events: [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { eventType, payload } = body
    const validUuid = toValidSessionUuid(id)

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabase = createServiceClient()
        const { data, error } = await supabase
          .from('session_events')
          .insert({
            session_id: validUuid,
            event_type: eventType || 'note',
            payload: payload || {},
          })
          .select()
          .single()

        if (!error && data) {
          return NextResponse.json({ event: data })
        }
      } catch {}
    }

    const event = {
      id: `evt-${Date.now()}`,
      session_id: id,
      event_type: eventType || 'note',
      payload: payload || {},
      created_at: new Date().toISOString(),
    }

    return NextResponse.json({ event })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
