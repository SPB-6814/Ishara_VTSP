/**
 * lib/sign-recognition.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Layer 1 — MediaPipe HandLandmarker (21 keypoints, runs in browser WASM)
 * Layer 2 — Custom Random Forest loaded from public/models/model.json
 * Layer 3 — Geometric heuristic fallbacks (open palm, fist, finger count)
 *
 * Runs entirely client-side. No server. No API key needed for detection.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  HandLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision'

// ─── Types ───────────────────────────────────────────────────────────────────

export type GestureSource = 'model' | 'heuristic'

export interface DetectedGesture {
  label: string          // e.g. "chest_pain"
  displayText: string    // e.g. "Chest pain"
  confidence: number     // 0–1
  source: GestureSource
  fingerCount?: number   // populated when source is heuristic finger-count
}

export interface FrameResult {
  gesture: DetectedGesture | null
  landmarks: NormalizedLandmark[] | null
  pendingConfidence: number   // 0–1 fill for the progress indicator
}

// ─── Random Forest Model ─────────────────────────────────────────────────────

interface RFNode {
  feature?: number
  threshold?: number
  left?: RFNode
  right?: RFNode
  leaf?: number
}

interface RFModel {
  type: string
  n_estimators: number
  n_features: number
  labels: string[]
  trees: RFNode[]
}

// ─── Internal state ───────────────────────────────────────────────────────────

let _landmarker: HandLandmarker | null = null
let _model: RFModel | null = null
let _isInitialising = false

// Debounce state
let _holdLabel: string | null = null
let _holdFrames = 0
const HOLD_FRAMES_REQUIRED = 15   // ~0.5s at 30fps

// Human-readable display names for model labels
const DISPLAY_NAMES: Record<string, string> = {
  chest_pain:     'Chest pain',
  stomach_pain:   'Stomach pain',
  head_pain:      'Headache',
  breathless:     'Difficulty breathing',
  allergy:        'Allergy',
  medicine:       'Need medicine',
  help:           'Need help',
  fever:          'Fever',
  vomit:          'Vomiting',
  dizzy:          'Feeling dizzy',
  bleeding:       'Bleeding',
  swelling:       'Swelling',
  nausea:         'Nausea',
  cough:          'Coughing',
  weakness:       'Weakness',
  diabetes:       'Diabetes',
  blood_pressure: 'Blood pressure issue',
  water:          'Need water',
  toilet:         'Need toilet',
  sleep:          'Can\'t sleep',
  eat:            'Need to eat',
  no_appetite:    'No appetite',
  itching:        'Itching',
  injury:         'Injury',
  anxiety:        'Anxiety',
}

// ─── Initialisation ───────────────────────────────────────────────────────────

export async function initRecognizers(): Promise<void> {
  if (_landmarker && _model) return
  if (_isInitialising) return
  _isInitialising = true

  try {
    // Load MediaPipe WASM
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    )

    _landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.6,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    // Load custom Random Forest model
    const res = await fetch('/models/model.json')
    if (res.ok) {
      _model = await res.json() as RFModel
      console.log(
        `[ISL] Custom model loaded: ${_model.n_estimators} trees, ${_model.labels.length} signs`
      )
    } else {
      console.warn('[ISL] model.json not found — falling back to heuristics only')
    }
  } catch (err) {
    console.error('[ISL] Init error:', err)
  } finally {
    _isInitialising = false
  }
}

export function destroyRecognizers(): void {
  _landmarker?.close()
  _landmarker = null
  _model = null
  _holdLabel = null
  _holdFrames = 0
}

// ─── Random Forest inference ──────────────────────────────────────────────────

function walkTree(node: RFNode, features: number[]): number {
  if (node.leaf !== undefined) return node.leaf
  return features[node.feature!] <= node.threshold!
    ? walkTree(node.left!, features)
    : walkTree(node.right!, features)
}

function classifyWithModel(landmarks: NormalizedLandmark[]): DetectedGesture | null {
  if (!_model) return null

  const features: number[] = []
  for (const lm of landmarks) {
    features.push(lm.x, lm.y, lm.z)
  }

  const votes = new Array<number>(_model.labels.length).fill(0)
  for (const tree of _model.trees) {
    votes[walkTree(tree, features)]++
  }

  const maxVotes = Math.max(...votes)
  const winnerIdx = votes.indexOf(maxVotes)
  const confidence = maxVotes / _model.n_estimators

  if (confidence < 0.60) return null

  const label = _model.labels[winnerIdx]
  return {
    label,
    displayText: DISPLAY_NAMES[label] ?? label.replace(/_/g, ' '),
    confidence,
    source: 'model',
  }
}

// ─── Geometric heuristics (Layer 3 fallback) ──────────────────────────────────

/**
 * MediaPipe hand landmark indices
 * TIP indices: thumb=4, index=8, middle=12, ring=16, pinky=20
 * MCP (knuckle) indices: thumb=2, index=5, middle=9, ring=13, pinky=17
 * PIP indices: index=6, middle=10, ring=14, pinky=18
 */
function isFingerExtended(lm: NormalizedLandmark[], tip: number, mcp: number): boolean {
  return lm[tip].y < lm[mcp].y
}

export function countExtendedFingers(lm: NormalizedLandmark[]): number {
  let count = 0
  // Thumb: compare tip.x vs ip.x (horizontal for thumb)
  const thumbExtended = Math.abs(lm[4].x - lm[2].x) > 0.04
  if (thumbExtended) count++
  // Four fingers
  const pairs: [number, number][] = [[8, 5], [12, 9], [16, 13], [20, 17]]
  for (const [tip, mcp] of pairs) {
    if (isFingerExtended(lm, tip, mcp)) count++
  }
  return count
}

function classifyWithHeuristics(lm: NormalizedLandmark[]): DetectedGesture | null {
  const fingerCount = countExtendedFingers(lm)

  // Open palm (4–5 fingers extended) → help
  if (fingerCount >= 4) {
    return {
      label: 'help',
      displayText: 'Need help',
      confidence: 0.80,
      source: 'heuristic',
    }
  }

  // Fist (0–1 fingers) → pain
  if (fingerCount <= 1) {
    return {
      label: 'chest_pain',
      displayText: 'Pain',
      confidence: 0.72,
      source: 'heuristic',
    }
  }

  // 2–3 fingers → pain scale number
  if (fingerCount >= 2 && fingerCount <= 3) {
    return {
      label: `pain_scale_${fingerCount}`,
      displayText: `Pain level ${fingerCount}`,
      confidence: 0.75,
      source: 'heuristic',
      fingerCount,
    }
  }

  return null
}

// ─── Main public API ──────────────────────────────────────────────────────────

/**
 * Call this once per animation frame.
 * Returns the gesture only after it has been held for HOLD_FRAMES_REQUIRED frames.
 * pendingConfidence (0–1) is always returned so the UI can show a progress ring.
 */
export function classifyFrame(
  video: HTMLVideoElement,
  timestampMs: number
): FrameResult {
  if (!_landmarker || video.readyState < 2) {
    return { gesture: null, landmarks: null, pendingConfidence: 0 }
  }

  let result: HandLandmarkerResult
  try {
    result = _landmarker.detectForVideo(video, timestampMs)
  } catch {
    return { gesture: null, landmarks: null, pendingConfidence: 0 }
  }

  if (!result.landmarks || result.landmarks.length === 0) {
    _holdLabel = null
    _holdFrames = 0
    return { gesture: null, landmarks: null, pendingConfidence: 0 }
  }

  const lm = result.landmarks[0]

  // Try model first, fall back to heuristics
  const candidate = classifyWithModel(lm) ?? classifyWithHeuristics(lm)

  if (!candidate) {
    _holdLabel = null
    _holdFrames = 0
    return { gesture: null, landmarks: lm, pendingConfidence: 0 }
  }

  // Debounce: must hold the same label for N frames
  if (candidate.label === _holdLabel) {
    _holdFrames++
  } else {
    _holdLabel = candidate.label
    _holdFrames = 1
  }

  const pendingConfidence = Math.min(_holdFrames / HOLD_FRAMES_REQUIRED, 1)

  if (_holdFrames < HOLD_FRAMES_REQUIRED) {
    return { gesture: null, landmarks: lm, pendingConfidence }
  }

  // Confirmed — reset so the same sign doesn't re-fire immediately
  _holdFrames = 0

  return { gesture: candidate, landmarks: lm, pendingConfidence: 1 }
}

/**
 * Returns raw landmarks for the canvas drawing layer without running classification.
 * Useful if you want to draw the skeleton on every frame regardless of hold state.
 */
export function getHandLandmarks(
  video: HTMLVideoElement,
  timestampMs: number
): NormalizedLandmark[] | null {
  if (!_landmarker || video.readyState < 2) return null
  try {
    const result = _landmarker.detectForVideo(video, timestampMs)
    return result.landmarks?.[0] ?? null
  } catch {
    return null
  }
}
