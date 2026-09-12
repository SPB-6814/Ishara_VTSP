import { AccessToken, VideoGrant } from 'livekit-server-sdk'

/**
 * Mint a LiveKit access token for a participant to join a room.
 *
 * @param roomName - The LiveKit room name (use sessionId)
 * @param participantName - Display name for the participant
 * @param participantIdentity - Unique identity (use their profile ID or 'patient-{sessionId}')
 */
export async function createLiveKitToken(
  roomName: string,
  participantName: string,
  participantIdentity: string
): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET

  if (!apiKey || !apiSecret) {
    throw new Error('LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set')
  }

  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: participantName,
    ttl: '2h',
  })
  token.addGrant(grant)

  return await token.toJwt()
}
