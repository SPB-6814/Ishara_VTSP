import { NextResponse } from 'next/server'
import { searchClips, getClipByKey, getClipUrl, resolveStorageFilename } from '@/lib/isl-clips'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const query = (body.query || '').trim()
    const key = body.key

    if (key) {
      const clip = getClipByKey(key)
      if (!clip) {
        return NextResponse.json({ error: 'Clip not found' }, { status: 404 })
      }

      const storageFile = resolveStorageFilename(clip.storage_path || clip.key)
      let signedUrl = getClipUrl(storageFile)

      // If Supabase Storage is configured, try to create a signed URL
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const supabase = createServiceClient()
          const { data } = await supabase.storage
            .from('isl-clips')
            .createSignedUrl(storageFile, 3600)
          if (data?.signedUrl) {
            signedUrl = data.signedUrl
          }
        } catch {}
      }

      return NextResponse.json({
        match: {
          clip,
          score: 1.0,
          signedUrl,
        },
      })
    }

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const matches = searchClips(query, 3)

    if (matches.length === 0) {
      return NextResponse.json({
        match: null,
        message: 'No matching ISL clip found. Please rephrase or request an interpreter.',
      })
    }

    const bestMatch = matches[0]
    const storageFile = resolveStorageFilename(bestMatch.clip.storage_path || bestMatch.clip.key)
    let signedUrl = bestMatch.signedUrl || getClipUrl(storageFile)

    // Check signed URL if available
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createServiceClient()
        const { data } = await supabase.storage
          .from('isl-clips')
          .createSignedUrl(storageFile, 3600)
        if (data?.signedUrl) {
          signedUrl = data.signedUrl
        }
      } catch {}
    }

    bestMatch.signedUrl = signedUrl

    return NextResponse.json({
      match: bestMatch,
      allMatches: matches,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
