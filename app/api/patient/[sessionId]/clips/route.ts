import { NextResponse } from 'next/server'
import { getClipByKey } from '@/lib/isl-clips'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const body = await request.json()
    const { clipKey } = body

    const clip = getClipByKey(clipKey)
    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      sessionId,
      clip,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
