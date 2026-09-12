import Fuse, { type IFuseOptions } from 'fuse.js'
import type { ISLClip, ISLClipMatch } from './types'
import { SEED_ISL_CLIPS } from './seed-clips'

let fuseIndex: Fuse<ISLClip> | null = null
let cachedClips: ISLClip[] = []

const FUSE_OPTIONS: IFuseOptions<ISLClip> = {
  keys: [
    { name: 'label', weight: 0.5 },
    { name: 'aliases', weight: 0.3 },
    { name: 'key', weight: 0.2 },
  ],
  threshold: 0.45,       // Lower = stricter matching
  includeScore: true,
  minMatchCharLength: 2,
}

/** Confidence threshold — below this we say "no match" */
export const MATCH_THRESHOLD = 0.55

/**
 * Initialize or refresh the Fuse.js index from an array of ISL clips.
 * Defaults to SEED_ISL_CLIPS if no clips passed.
 */
export function initializeClipIndex(clips: ISLClip[] = SEED_ISL_CLIPS) {
  cachedClips = clips
  fuseIndex = new Fuse(clips, FUSE_OPTIONS)
}

// Ensure default index is ready on module load
initializeClipIndex(SEED_ISL_CLIPS)

/**
 * Search for ISL clips matching a free-text phrase.
 * Returns matches sorted by relevance (best first).
 */
export function searchClips(query: string, maxResults = 5): ISLClipMatch[] {
  if (!fuseIndex) {
    initializeClipIndex()
  }

  const results = fuseIndex!.search(query, { limit: maxResults })

  return results
    .filter((r) => r.score !== undefined && r.score <= MATCH_THRESHOLD)
    .map((r) => ({
      clip: r.item,
      score: 1 - (r.score ?? 1), // Convert Fuse score (0=perfect) to confidence (1=perfect)
      signedUrl: `/videos/placeholder-isl.mp4`, // Fallback path if storage url not signed
    }))
}

/**
 * Get a clip by its exact key slug (e.g. 'chest-pain').
 */
export function getClipByKey(key: string): ISLClip | undefined {
  if (cachedClips.length === 0) {
    initializeClipIndex()
  }
  return cachedClips.find((c) => c.key === key)
}

/**
 * Get all clips, optionally filtered by category.
 */
export function getAllClips(category?: string): ISLClip[] {
  if (cachedClips.length === 0) {
    initializeClipIndex()
  }
  if (category) {
    return cachedClips.filter((c) => c.category === category)
  }
  return cachedClips
}
