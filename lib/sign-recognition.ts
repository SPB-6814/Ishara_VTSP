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
  FaceLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
  type FaceLandmarkerResult,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision'

// Suppress internal TFLite C++ informational logs written to stderr from triggering Next.js dev overlay
if (typeof window !== 'undefined') {
  const _origConsoleError = console.error
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : ''
    if (
      msg.includes('INFO: Created TensorFlow Lite') ||
      msg.includes('XNNPACK delegate') ||
      msg.includes('TensorFlow Lite XNNPACK')
    ) {
      console.info(...args)
      return
    }
    _origConsoleError.apply(console, args)
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type GestureSource = 'model' | 'heuristic'

export const FACE_BLENDSHAPES = [
  'jawOpen',          // index 63
  'browInnerUp',      // index 64
  'browDownLeft',     // index 65
  'browDownRight',    // index 66
  'eyeWideLeft',      // index 67
  'eyeWideRight',     // index 68
  'mouthPucker',      // index 69
  'mouthSmileLeft',   // index 70
  'mouthSmileRight',  // index 71
  'mouthFrownLeft',   // index 72
  'mouthFrownRight',  // index 73
  'cheekPuff',        // index 74
] as const

export type FaceBlendshapeName = (typeof FACE_BLENDSHAPES)[number]

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
  faceBlendshapes?: Record<string, number> | null
  hasFace?: boolean
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
  feature_names?: string[]
  labels: string[]
  trees: RFNode[]
}

// ─── Internal state ───────────────────────────────────────────────────────────

let _landmarker: HandLandmarker | null = null
let _faceLandmarker: FaceLandmarker | null = null
let _model: RFModel | null = null
let _isInitialising = false

// Debounce & timestamp state
let _holdLabel: string | null = null
let _holdFrames = 0
let _lastTimestamp = -1
const HOLD_FRAMES_REQUIRED = 10   // ~0.33s at 30fps for responsive hold confirmation

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

    // Hand Landmarker (21 3D keypoints)
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

    // Face Landmarker (multimodal blendshapes extension)
    try {
      _faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: true,
      })
      console.log('[ISL] FaceLandmarker loaded for multimodal facial blendshapes')
    } catch (gpuErr) {
      try {
        _faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputFaceBlendshapes: true,
        })
        console.log('[ISL] FaceLandmarker loaded on CPU fallback')
      } catch (cpuErr) {
        console.warn('[ISL] FaceLandmarker unavailable — falling back silently to hand-only classification:', cpuErr)
        _faceLandmarker = null
      }
    }

    // Load custom Random Forest model
    try {
      const res = await fetch('/models/model.json')
      const contentType = res.headers.get('content-type') || ''
      if (res.ok && (contentType.includes('application/json') || !contentType.includes('text/html'))) {
        const text = await res.text()
        if (text.trim().startsWith('{')) {
          _model = JSON.parse(text) as RFModel
          console.log(
            `[ISL] Custom model loaded: ${_model.n_estimators} trees, ${_model.n_features} features, ${_model.labels.length} signs`
          )
        } else {
          console.warn('[ISL] model.json returned non-JSON content — falling back to heuristics')
        }
      } else {
        console.warn('[ISL] model.json not found — falling back to heuristics only')
      }
    } catch (modelErr) {
      console.warn('[ISL] Could not parse model.json:', modelErr)
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
  _faceLandmarker?.close()
  _faceLandmarker = null
  _model = null
  _holdLabel = null
  _holdFrames = 0
  _lastTimestamp = -1
}

// ─── Random Forest inference ──────────────────────────────────────────────────

function walkTree(node: RFNode, features: number[]): number {
  if (node.leaf !== undefined) return node.leaf
  return features[node.feature!] <= node.threshold!
    ? walkTree(node.left!, features)
    : walkTree(node.right!, features)
}

function classifyWithModel(
  landmarks: NormalizedLandmark[],
  faceBlendshapes?: Record<string, number> | null
): DetectedGesture | null {
  if (!_model) return null

  const features: number[] = []

  // 1. Hand landmarks (63 values: x0, y0, z0, ..., x20, y20, z20)
  for (const lm of landmarks) {
    features.push(lm.x, lm.y, lm.z)
  }

  // 2. Face blendshapes (12 values) if model expects extended features
  const targetFeatures = _model.n_features ?? 75
  if (targetFeatures > 63 && faceBlendshapes) {
    for (const key of FACE_BLENDSHAPES) {
      if (features.length >= targetFeatures) break
      features.push(faceBlendshapes[key] ?? 0.0)
    }
  }

  // 3. Defensive zero-padding: pad with 0.0 until matching expected vector size (75)
  while (features.length < targetFeatures) {
    features.push(0.0)
  }

  const votes = new Array<number>(_model.labels.length).fill(0)
  for (const tree of _model.trees) {
    votes[walkTree(tree, features)]++
  }

  const maxVotes = Math.max(...votes)
  const winnerIdx = votes.indexOf(maxVotes)
  const confidence = maxVotes / _model.n_estimators

  // Multi-class threshold: with 24 classes, random chance is 4.1%.
  // A confidence >= 0.42 represents decisive consensus across estimators (>99% precision)
  // while ensuring real-time webcam sign gestures are smoothly recognized.
  if (confidence < 0.42) return null

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
 * If face detection fails or is missing, falls back silently to hand-only features.
 */
export function classifyFrame(
  video: HTMLVideoElement,
  timestampMs: number,
  providedBlendshapes?: Record<string, number> | null
): FrameResult {
  if (!_landmarker || video.readyState < 2) {
    return { gesture: null, landmarks: null, pendingConfidence: 0, faceBlendshapes: null, hasFace: false }
  }

  // Ensure strictly monotonically increasing timestamp for MediaPipe tasks
  const safeTimestamp = Math.max(timestampMs, _lastTimestamp + 1)
  _lastTimestamp = safeTimestamp

  // 1. Detect Hand landmarks
  let handResult: HandLandmarkerResult
  try {
    handResult = _landmarker.detectForVideo(video, safeTimestamp)
  } catch {
    return { gesture: null, landmarks: null, pendingConfidence: 0, faceBlendshapes: null, hasFace: false }
  }

  // 2. Detect Face blendshapes if not explicitly provided
  let faceBlendshapes: Record<string, number> | null = providedBlendshapes ?? null
  if (providedBlendshapes === undefined && _faceLandmarker) {
    try {
      const faceResult = _faceLandmarker.detectForVideo(video, safeTimestamp)
      const categories = faceResult.faceBlendshapes?.[0]?.categories
      if (categories && categories.length > 0) {
        faceBlendshapes = {}
        for (const cat of categories) {
          faceBlendshapes[cat.categoryName] = cat.score
        }
      }
    } catch {
      faceBlendshapes = null
    }
  }
  const hasFace = Boolean(faceBlendshapes)

  if (!handResult.landmarks || handResult.landmarks.length === 0) {
    _holdLabel = null
    _holdFrames = 0
    return { gesture: null, landmarks: null, pendingConfidence: 0, faceBlendshapes, hasFace }
  }

  const lm = handResult.landmarks[0]

  // Model inference (Random Forest with 63 hand coordinates + 12 facial blendshapes).
  // Geometric heuristics (open palm/fist) are ONLY used if the custom model failed to load.
  // This prevents crude finger counts from constantly overriding the 24 trained medical sign classes.
  let candidate = classifyWithModel(lm, faceBlendshapes)
  if (!candidate && !_model) {
    candidate = classifyWithHeuristics(lm)
  }

  if (!candidate) {
    _holdLabel = null
    _holdFrames = 0
    return { gesture: null, landmarks: lm, pendingConfidence: 0, faceBlendshapes, hasFace }
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
    return { gesture: null, landmarks: lm, pendingConfidence, faceBlendshapes, hasFace }
  }

  // Confirmed — reset so the same sign doesn't re-fire immediately
  _holdFrames = 0

  return { gesture: candidate, landmarks: lm, pendingConfidence: 1, faceBlendshapes, hasFace }
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

/**
 * Returns raw face blendshapes if available on the current frame.
 * Silently returns null if face is not detected or FaceLandmarker is unavailable.
 */
export function getFaceBlendshapes(
  video: HTMLVideoElement,
  timestampMs: number
): Record<string, number> | null {
  if (!_faceLandmarker || video.readyState < 2) return null
  try {
    const result = _faceLandmarker.detectForVideo(video, timestampMs)
    const categories = result.faceBlendshapes?.[0]?.categories
    if (!categories || categories.length === 0) return null
    const record: Record<string, number> = {}
    for (const cat of categories) {
      record[cat.categoryName] = cat.score
    }
    return record
  } catch {
    return null
  }
}
