import { NextResponse } from 'next/server'
import { createLiveKitToken } from '@/lib/livekit'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { roomName, participantName, identity } = body

    if (!roomName || !participantName) {
      return NextResponse.json(
        { error: 'roomName and participantName are required' },
        { status: 400 }
      )
    }

    const participantIdentity = identity || `user-${Date.now()}`

    // Check if LiveKit credentials are set
    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      return NextResponse.json({
        token: `simulated-token-${roomName}-${participantIdentity}`,
        serverUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://demo.livekit.cloud',
        simulated: true,
        message: 'LiveKit credentials not configured in environment. Using simulated token for demo.',
      })
    }

    const token = await createLiveKitToken(
      roomName,
      participantName,
      participantIdentity
    )

    return NextResponse.json({
      token,
      serverUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL,
      simulated: false,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
