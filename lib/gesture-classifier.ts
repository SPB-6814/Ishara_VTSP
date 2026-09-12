/**
 * Rule-Based / Heuristic Clinical Gesture Classifier for Ishara
 * Uses 21 3D MediaPipe Hand Landmarks to classify core medical emergency signs.
 */

export interface Landmark {
  x: number
  y: number
  z: number
}

export interface ClassifiedGesture {
  name: string
  label: string
  confidence: number
  category: 'Emergency' | 'Pain' | 'Response'
}

export interface GestureEvent {
  text: string
  label: string
  confidence: number
  timestamp: string
}

/**
 * Check if a finger is extended (tip is higher than PIP joint in inverted screen coordinates)
 */
function isFingerExtended(tip: Landmark, pip: Landmark, mcp?: Landmark): boolean {
  if (mcp) {
    // Distance from MCP to TIP vs MCP to PIP
    const distTip = Math.hypot(tip.x - mcp.x, tip.y - mcp.y)
    const distPip = Math.hypot(pip.x - mcp.x, pip.y - mcp.y)
    return distTip > distPip * 1.25 && tip.y < pip.y
  }
  return tip.y < pip.y
}

/**
 * Check if thumb is extended away from palm
 */
function isThumbExtended(thumbTip: Landmark, thumbMcp: Landmark, wrist: Landmark): boolean {
  const dist = Math.hypot(thumbTip.x - thumbMcp.x, thumbTip.y - thumbMcp.y)
  const wristDist = Math.hypot(thumbTip.x - wrist.x, thumbTip.y - wrist.y)
  return dist > 0.08 && wristDist > 0.15
}

/**
 * Classify hand landmarks into a clinical gesture
 */
export function classifyHandGesture(landmarks: Landmark[]): ClassifiedGesture | null {
  if (!landmarks || landmarks.length < 21) return null

  const wrist = landmarks[0]
  const thumbMcp = landmarks[2]
  const thumbIp = landmarks[3]
  const thumbTip = landmarks[4]
  const indexMcp = landmarks[5]
  const indexPip = landmarks[6]
  const indexTip = landmarks[8]
  const middlePip = landmarks[10]
  const middleTip = landmarks[12]
  const ringPip = landmarks[14]
  const ringTip = landmarks[16]
  const pinkyPip = landmarks[18]
  const pinkyTip = landmarks[20]

  const indexExt = isFingerExtended(indexTip, indexPip, indexMcp)
  const middleExt = isFingerExtended(middleTip, middlePip, landmarks[9])
  const ringExt = isFingerExtended(ringTip, ringPip, landmarks[13])
  const pinkyExt = isFingerExtended(pinkyTip, pinkyPip, landmarks[17])
  const thumbExt = isThumbExtended(thumbTip, thumbMcp, wrist)

  const extendedCount = (indexExt ? 1 : 0) + (middleExt ? 1 : 0) + (ringExt ? 1 : 0) + (pinkyExt ? 1 : 0)
  const allFingersCurled = !indexExt && !middleExt && !ringExt && !pinkyExt

  // 1. Thumbs Up ("Yes / Agree")
  // Thumb pointing vertically up, other 4 fingers curled
  if (allFingersCurled && thumbTip.y < thumbIp.y - 0.04 && thumbTip.y < indexMcp.y) {
    return {
      name: 'yes_agree',
      label: 'Yes / Agree (हाँ / सहमत)',
      confidence: 0.94,
      category: 'Response',
    }
  }

  // 2. Clenched Fist on Chest / Torso ("Chest Pain" or "Severe Pain")
  // All fingers folded into a tight fist
  if (allFingersCurled && !thumbExt) {
    // If fist is held in central or chest region (y between 0.35 and 0.85, x between 0.2 and 0.8)
    const isTorsoArea = wrist.y >= 0.35 && wrist.y <= 0.88 && wrist.x >= 0.15 && wrist.x <= 0.85
    if (isTorsoArea) {
      return {
        name: 'chest_pain',
        label: 'Chest Pain (सीने में दर्द)',
        confidence: 0.92,
        category: 'Emergency',
      }
    }
    return {
      name: 'acute_pain',
      label: 'Acute Pain (गंभीर दर्द)',
      confidence: 0.88,
      category: 'Pain',
    }
  }

  // 3. Open Palm ("Help Me / Emergency")
  // All 4 fingers extended + thumb extended, hand spread wide
  if (extendedCount === 4 && thumbExt) {
    return {
      name: 'help_emergency',
      label: 'Help Me / Emergency (मदद चाहिए / आपातकालीन)',
      confidence: 0.95,
      category: 'Emergency',
    }
  }

  // 4. Pointing Index Finger ("No / Disagree" or "Pain Level 1")
  if (indexExt && !middleExt && !ringExt && !pinkyExt && !thumbExt) {
    // Can be used as Pain Level 1 or No
    return {
      name: 'pain_level_1',
      label: 'Pain Level: 1 (दर्द स्तर: १)',
      confidence: 0.91,
      category: 'Pain',
    }
  }

  // 5. Number Counting (Pain Scale 2 to 5)
  if (indexExt && middleExt && !ringExt && !pinkyExt) {
    return {
      name: 'pain_level_2',
      label: 'Pain Level: 2 (दर्द स्तर: २)',
      confidence: 0.93,
      category: 'Pain',
    }
  }

  if (indexExt && middleExt && ringExt && !pinkyExt) {
    return {
      name: 'pain_level_3',
      label: 'Pain Level: 3 (दर्द स्तर: ३)',
      confidence: 0.92,
      category: 'Pain',
    }
  }

  if (extendedCount === 4 && !thumbExt) {
    return {
      name: 'pain_level_4',
      label: 'Pain Level: 4 (दर्द स्तर: ४)',
      confidence: 0.91,
      category: 'Pain',
    }
  }

  if (extendedCount === 4 && thumbExt) {
    return {
      name: 'pain_level_5',
      label: 'Pain Level: 5 (दर्द स्तर: ५ - अत्यधिक दर्द)',
      confidence: 0.9,
      category: 'Pain',
    }
  }

  return null
}

/**
 * 800ms Temporal Debounce & Stability Filter
 * Ensures a sign must be held steadily for at least 800ms before triggering Realtime broadcast
 */
export class ClinicalGestureDebouncer {
  private candidateGesture: string | null = null
  private candidateStartTime = 0
  private lastTriggeredGesture: string | null = null
  private lastTriggeredTime = 0
  private debounceMs: number
  private cooldownMs: number

  constructor(debounceMs = 800, cooldownMs = 2500) {
    this.debounceMs = debounceMs
    this.cooldownMs = cooldownMs
  }

  /**
   * Process a frame's gesture. Returns GestureEvent if stability criteria met.
   */
  process(gesture: ClassifiedGesture | null): GestureEvent | null {
    const now = Date.now()

    if (!gesture) {
      this.candidateGesture = null
      this.candidateStartTime = 0
      return null
    }

    // If new candidate gesture, start tracking dwell time
    if (this.candidateGesture !== gesture.name) {
      this.candidateGesture = gesture.name
      this.candidateStartTime = now
      return null
    }

    // Check dwell time
    const dwellDuration = now - this.candidateStartTime
    if (dwellDuration >= this.debounceMs) {
      // Check cooldown so we don't spam the exact same sign repeatedly
      const isSameAsLast = this.lastTriggeredGesture === gesture.name
      const timeSinceLast = now - this.lastTriggeredTime

      if (!isSameAsLast || timeSinceLast >= this.cooldownMs) {
        this.lastTriggeredGesture = gesture.name
        this.lastTriggeredTime = now

        return {
          text: gesture.label,
          label: gesture.label,
          confidence: gesture.confidence,
          timestamp: new Date().toISOString(),
        }
      }
    }

    return null
  }

  /**
   * Reset the filter
   */
  reset() {
    this.candidateGesture = null
    this.candidateStartTime = 0
    this.lastTriggeredGesture = null
    this.lastTriggeredTime = 0
  }
}
