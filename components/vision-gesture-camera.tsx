'use client'

/**
 * components/vision-gesture-camera.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Patient-side sign language camera component.
 *
 * Features:
 *  - Live <video> + <canvas> overlay drawing MediaPipe hand skeleton
 *  - Privacy shutter toggle (camera on / off)
 *  - Confidence progress ring (fills as gesture is held)
 *  - 800ms debounce before dispatching via sendGestureText
 *  - Word buffer chips showing accumulated session words
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  initRecognizers,
  destroyRecognizers,
  classifyFrame,
  type DetectedGesture,
} from '@/lib/sign-recognition'

// ─── MediaPipe hand connections for skeleton drawing ─────────────────────────
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],           // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],           // index
  [0, 9], [9, 10], [10, 11], [11, 12],      // middle
  [0, 13], [13, 14], [14, 15], [15, 16],    // ring
  [0, 17], [17, 18], [18, 19], [19, 20],    // pinky
  [5, 9], [9, 13], [13, 17],                // palm
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface VisionGestureCameraProps {
  /** Called after 800ms debounce with confirmed gesture text + confidence */
  sendGestureText: (text: string, confidence: number) => void
  /** Optional callback when camera active state changes */
  onCameraStateChange?: (active: boolean) => void
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VisionGestureCamera({
  sendGestureText,
  onCameraStateChange,
  className = '',
}: VisionGestureCameraProps) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const rafRef     = useRef<number>(0)
  const streamRef  = useRef<MediaStream | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSentRef = useRef<string>('')

  const [cameraOn,        setCameraOn]        = useState(false)
  const [modelReady,      setModelReady]      = useState(false)
  const [faceDetected,    setFaceDetected]    = useState(false)
  const [pendingConf,     setPendingConf]     = useState(0)
  const [lastGesture,     setLastGesture]     = useState<DetectedGesture | null>(null)
  const [wordBuffer,      setWordBuffer]      = useState<string[]>([])
  const [flashLabel,      setFlashLabel]      = useState('')
  const [initError,       setInitError]       = useState('')

  // ─── Skeleton drawing ───────────────────────────────────────────────────────

  const drawSkeleton = useCallback(
    (landmarks: { x: number; y: number }[] | null) => {
      const canvas = canvasRef.current
      const video  = videoRef.current
      if (!canvas || !video) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width  = video.videoWidth  || canvas.offsetWidth
      canvas.height = video.videoHeight || canvas.offsetHeight
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (!landmarks) return

      const W = canvas.width
      const H = canvas.height

      // Connection lines
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'
      ctx.lineWidth   = 1.5
      for (const [a, b] of HAND_CONNECTIONS) {
        ctx.beginPath()
        ctx.moveTo(landmarks[a].x * W, landmarks[a].y * H)
        ctx.lineTo(landmarks[b].x * W, landmarks[b].y * H)
        ctx.stroke()
      }

      // Landmark dots
      for (const lm of landmarks) {
        ctx.beginPath()
        ctx.arc(lm.x * W, lm.y * H, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#4ade80'
        ctx.fill()
      }
    },
    []
  )

  // ─── Recognition loop ───────────────────────────────────────────────────────

  const startLoop = useCallback(() => {
    const tick = (ts: number) => {
      const video = videoRef.current
      if (!video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const { gesture, landmarks, pendingConfidence, hasFace } = classifyFrame(video, ts)

      drawSkeleton(landmarks)
      setPendingConf(pendingConfidence)
      if (hasFace !== undefined) {
        setFaceDetected(hasFace)
      }

      if (gesture) {
        setLastGesture(gesture)
        setFlashLabel(gesture.displayText)
        setTimeout(() => setFlashLabel(''), 1500)

        // Add to word buffer (max 8)
        setWordBuffer(prev => {
          const next = [...prev, gesture.displayText].slice(-8)
          return next
        })

        // 800ms debounce before sending to avoid duplicate fires
        const key = `${gesture.label}_${Date.now()}`
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
          if (key !== lastSentRef.current) {
            lastSentRef.current = key
            sendGestureText(gesture.displayText, gesture.confidence)
          }
        }, 800)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [drawSkeleton, sendGestureText])

  // ─── Camera on/off ──────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraOn(true)
      onCameraStateChange?.(true)
      startLoop()
    } catch (err) {
      setInitError('Camera permission denied or unavailable.')
      console.error('[ISL Camera]', err)
    }
  }, [onCameraStateChange, startLoop])

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
    setCameraOn(false)
    setPendingConf(0)
    setFaceDetected(false)
    onCameraStateChange?.(false)
  }, [onCameraStateChange])

  const toggleCamera = useCallback(() => {
    if (cameraOn) stopCamera()
    else startCamera()
  }, [cameraOn, startCamera, stopCamera])

  // ─── Init model on mount ────────────────────────────────────────────────────

  useEffect(() => {
    initRecognizers()
      .then(() => setModelReady(true))
      .catch(err => setInitError(`Model load failed: ${err?.message ?? err}`))

    return () => {
      cancelAnimationFrame(rafRef.current)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      destroyRecognizers()
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  // ─── Confidence ring SVG ────────────────────────────────────────────────────

  const ringR  = 14
  const ringC  = 2 * Math.PI * ringR
  const ringOffset = ringC * (1 - pendingConf)

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={`flex flex-col gap-3 ${className}`}>

      {/* Camera card */}
      <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video w-full border border-slate-200 dark:border-slate-800 shadow-inner">

        {/* Video */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          muted
          playsInline
          aria-label="Patient sign language camera feed"
        />

        {/* Skeleton overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full scale-x-[-1] pointer-events-none"
          aria-hidden
        />

        {/* Privacy shutter */}
        {!cameraOn && (
          <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-medium">Camera is off</p>
          </div>
        )}

        {/* Top-left: face + hand tracking indicator when camera is active */}
        {cameraOn && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            <span
              className={`text-xs px-2.5 py-1 rounded-full backdrop-blur-md transition-all flex items-center gap-1.5 border ${
                faceDetected
                  ? 'bg-blue-950/70 border-blue-400/40 text-blue-300 shadow-sm shadow-blue-500/20'
                  : 'bg-black/60 border-white/10 text-gray-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  faceDetected ? 'bg-blue-400 animate-pulse' : 'bg-gray-500'
                }`}
              />
              <span className="font-medium">
                {faceDetected ? 'ISL + Face' : 'ISL Hand'}
              </span>
            </span>
          </div>
        )}

        {/* Top-right: confidence ring + label */}
        {cameraOn && (
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {/* Progress ring */}
            <svg width="36" height="36" aria-hidden>
              <circle cx="18" cy="18" r={ringR} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3"/>
              <circle
                cx="18" cy="18" r={ringR}
                fill="none"
                stroke={pendingConf >= 1 ? '#4ade80' : '#f59e0b'}
                strokeWidth="3"
                strokeDasharray={ringC}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                transform="rotate(-90 18 18)"
                style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.2s' }}
              />
            </svg>

            {/* Gesture label pill */}
            {lastGesture && (
              <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                {lastGesture.displayText}
                <span className="ml-1 opacity-60">
                  {Math.round(lastGesture.confidence * 100)}%
                </span>
              </span>
            )}
          </div>
        )}

        {/* Flash confirmation overlay */}
        {flashLabel && (
          <div className="absolute bottom-16 left-0 right-0 flex justify-center pointer-events-none">
            <span className="bg-green-500/90 text-white text-lg font-medium px-4 py-2 rounded-full backdrop-blur-sm animate-pulse">
              {flashLabel}
            </span>
          </div>
        )}

        {/* Model loading indicator */}
        {!modelReady && !initError && (
          <div className="absolute top-3 left-3">
            <span className="bg-amber-500/80 text-white text-xs px-2 py-1 rounded-full">
              Loading model…
            </span>
          </div>
        )}

        {/* Error */}
        {initError && (
          <div className="absolute top-3 left-3 right-3">
            <span className="bg-red-500/80 text-white text-xs px-2 py-1 rounded-md block text-center">
              {initError}
            </span>
          </div>
        )}
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3">

        {/* Privacy toggle */}
        <button
          onClick={toggleCamera}
          disabled={!modelReady && !cameraOn}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs
            ${cameraOn
              ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-300 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 dark:border-red-500/30'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 dark:border-green-500/30'}
            disabled:opacity-40 disabled:cursor-not-allowed`}
          aria-label={cameraOn ? 'Stop camera' : 'Start camera'}
        >
          {cameraOn ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
              </svg>
              Stop camera
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
              </svg>
              Start signing / इशारा शुरू करें
            </>
          )}
        </button>

        {/* Clear word buffer */}
        {wordBuffer.length > 0 && (
          <button
            onClick={() => setWordBuffer([])}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors ml-auto"
          >
            Clear words
          </button>
        )}
      </div>

      {/* Word buffer chips */}
      {wordBuffer.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="list" aria-label="Detected words">
          {wordBuffer.map((word, i) => (
            <span
              key={i}
              role="listitem"
              className="bg-indigo-50 text-indigo-800 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 text-xs px-2.5 py-1 rounded-full font-bold shadow-2xs"
            >
              {word}
            </span>
          ))}
        </div>
      )}

    </div>
  )
}
