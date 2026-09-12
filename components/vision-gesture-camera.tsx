'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  Camera,
  CameraOff,
  Eye,
  EyeOff,
  Sparkles,
  Maximize2,
  Minimize2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  classifyHandGesture,
  ClinicalGestureDebouncer,
  type GestureEvent,
  type Landmark,
} from '@/lib/gesture-classifier'

interface VisionGestureCameraProps {
  onGestureDetected: (event: GestureEvent) => void
  autoStart?: boolean
}

// Landmark connection pairs for drawing hand skeleton
const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [5, 9], [9, 13], [13, 17],
]

export function VisionGestureCamera({
  onGestureDetected,
  autoStart = true,
}: VisionGestureCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const landmarkerRef = useRef<any>(null)
  const animFrameIdRef = useRef<number | null>(null)
  const debouncerRef = useRef(new ClinicalGestureDebouncer(800, 2500))

  const [isCameraActive, setIsCameraActive] = useState(autoStart)
  const [isLoadingModel, setIsLoadingModel] = useState(true)
  const [modelError, setModelError] = useState<string | null>(null)
  const [liveGestureLabel, setLiveGestureLabel] = useState<string | null>(null)
  const [liveConfidence, setLiveConfidence] = useState<number | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const [recentDetection, setRecentDetection] = useState<string | null>(null)

  // 1. Initialize MediaPipe HandLandmarker
  useEffect(() => {
    let isMounted = true

    async function initMediaPipe() {
      try {
        setIsLoadingModel(true)
        setModelError(null)

        const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision')
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        )

        if (!isMounted) return

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.6,
          minTrackingConfidence: 0.6,
        })

        if (!isMounted) return
        landmarkerRef.current = landmarker
        setIsLoadingModel(false)
      } catch (err: any) {
        console.warn('MediaPipe initialization warning (falling back):', err)
        if (isMounted) {
          setModelError('Could not load vision model. Check internet connection.')
          setIsLoadingModel(false)
        }
      }
    }

    initMediaPipe()

    return () => {
      isMounted = false
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close()
        } catch {}
      }
    }
  }, [])

  // 2. Start Camera Stream
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsCameraActive(true)
    } catch (err: any) {
      console.warn('Camera access error:', err)
      setIsCameraActive(false)
    }
  }, [])

  // 3. Stop Camera Stream (Privacy Shutter)
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current)
      animFrameIdRef.current = null
    }
    setIsCameraActive(false)
    setLiveGestureLabel(null)
    setLiveConfidence(null)
    debouncerRef.current.reset()

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }, [])

  // Handle active camera lifecycle
  useEffect(() => {
    if (isCameraActive) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isCameraActive, startCamera, stopCamera])

  // 4. Real-Time Detection Loop & Skeleton Overlay Canvas
  useEffect(() => {
    let active = true

    function detectFrame() {
      if (!active) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const landmarker = landmarkerRef.current

      if (
        isCameraActive &&
        video &&
        video.readyState >= 2 &&
        canvas &&
        landmarker
      ) {
        const videoWidth = video.videoWidth || 640
        const videoHeight = video.videoHeight || 480

        if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
          canvas.width = videoWidth
          canvas.height = videoHeight
        }

        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          try {
            const results = landmarker.detectForVideo(video, performance.now())

            if (results && results.landmarks && results.landmarks.length > 0) {
              let topGesture = null

              for (const handLandmarks of results.landmarks) {
                // 1. Draw Skeleton Connections
                ctx.lineWidth = 3
                ctx.strokeStyle = '#06b6d4' // Cyan neon bones
                ctx.shadowColor = '#22d3ee'
                ctx.shadowBlur = 8

                for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
                  const p1 = handLandmarks[startIdx]
                  const p2 = handLandmarks[endIdx]
                  if (p1 && p2) {
                    ctx.beginPath()
                    ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height)
                    ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height)
                    ctx.stroke()
                  }
                }

                // 2. Draw Landmark Joints
                for (let i = 0; i < handLandmarks.length; i++) {
                  const lm = handLandmarks[i]
                  ctx.beginPath()
                  ctx.arc(lm.x * canvas.width, lm.y * canvas.height, i === 4 || i === 8 || i === 12 || i === 16 || i === 20 ? 6 : 4, 0, 2 * Math.PI)
                  ctx.fillStyle = i === 0 ? '#f59e0b' : '#38bdf8'
                  ctx.fill()
                  ctx.lineWidth = 1.5
                  ctx.strokeStyle = '#ffffff'
                  ctx.stroke()
                }

                // 3. Classify Gesture
                const classified = classifyHandGesture(handLandmarks as Landmark[])
                if (classified) {
                  topGesture = classified
                }
              }

              if (topGesture) {
                setLiveGestureLabel(topGesture.label)
                setLiveConfidence(topGesture.confidence)

                // Run through temporal debounce filter
                const triggeredEvent = debouncerRef.current.process(topGesture)
                if (triggeredEvent) {
                  setRecentDetection(triggeredEvent.label)
                  onGestureDetected(triggeredEvent)
                }
              } else {
                setLiveGestureLabel(null)
                setLiveConfidence(null)
                debouncerRef.current.process(null)
              }
            } else {
              setLiveGestureLabel(null)
              setLiveConfidence(null)
              debouncerRef.current.process(null)
            }
          } catch {
            // Ignore occasional frame detection drops
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(detectFrame)
    }

    animFrameIdRef.current = requestAnimationFrame(detectFrame)

    return () => {
      active = false
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current)
      }
    }
  }, [isCameraActive, onGestureDetected])

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border-2 border-teal-500/40 bg-slate-950 shadow-xl transition-all duration-300 ${
        isMinimized ? 'w-48 h-36' : 'w-full aspect-video sm:aspect-[4/3] max-h-[360px]'
      }`}
    >
      {/* Top Header Controls Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between text-white text-xs">
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isCameraActive ? 'bg-emerald-400 animate-ping' : 'bg-red-500'
            }`}
          />
          <span className="font-bold text-[11px] tracking-wide">
            {isCameraActive ? 'Vision Sign AI Live' : 'Camera Shutter Closed'}
          </span>
          {isLoadingModel && (
            <span className="text-[10px] text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded animate-pulse">
              Loading AI Model...
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Privacy Shutter Toggle */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setIsCameraActive(!isCameraActive)}
            title={isCameraActive ? 'Close Privacy Shutter' : 'Open Camera Shutter'}
            className="h-7 w-7 text-white hover:bg-white/20 rounded-lg"
          >
            {isCameraActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </Button>

          {/* Minimize / Maximize */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-7 w-7 text-white hover:bg-white/20 rounded-lg"
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Video & Canvas Elements */}
      {isCameraActive ? (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className="w-full h-full object-cover -scale-x-100" // Mirror for natural signing feel
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none"
          />

          {/* Realtime Live Gesture HUD Pill */}
          {liveGestureLabel && (
            <div className="absolute top-10 left-3 right-3 z-20 flex items-center justify-between p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-teal-400 text-white shadow-lg animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-300 animate-pulse" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-300 block leading-tight">
                    Recognizing Gesture
                  </span>
                  <span className="text-xs font-black">{liveGestureLabel}</span>
                </div>
              </div>
              {liveConfidence && (
                <span className="text-[10px] font-mono font-bold bg-teal-900/80 text-teal-200 px-2 py-0.5 rounded-full border border-teal-500/50">
                  {Math.round(liveConfidence * 100)}%
                </span>
              )}
            </div>
          )}

          {/* Detection Alert Banner when Debounce Triggers */}
          {recentDetection && (
            <div className="absolute bottom-3 left-3 right-3 z-20 p-2 rounded-xl bg-emerald-600/95 text-white text-xs font-bold flex items-center justify-between shadow-xl animate-in slide-in-from-bottom-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Broadcasted: {recentDetection}
              </span>
              <span className="text-[10px] opacity-80 uppercase tracking-widest font-extrabold">
                Sent to Doctor
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Privacy Shutter Closed State (HIPAA Compliant) */
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-900 text-white text-center space-y-3">
          <div className="p-3 rounded-full bg-slate-800 border-2 border-slate-700 text-slate-400">
            <CameraOff className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-sm font-bold flex items-center justify-center gap-1.5 text-slate-200">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Camera Privacy Shutter Closed
            </h4>
            <p className="text-[11px] text-slate-400 max-w-xs mt-1">
              Camera hardware is completely deactivated to protect patient privacy.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsCameraActive(true)}
            className="bg-[#084C5B] hover:bg-[#0D748A] text-white font-bold text-xs h-8 px-4 rounded-xl flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Turn On Sign Detection Camera</span>
          </Button>
        </div>
      )}

      {/* Model Error Fallback */}
      {modelError && (
        <div className="absolute inset-0 z-30 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center text-amber-200 text-xs space-y-2">
          <AlertCircle className="w-6 h-6 text-amber-400" />
          <p>{modelError}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.reload()}
            className="text-xs border-amber-500 text-amber-200"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Reload Model
          </Button>
        </div>
      )}
    </div>
  )
}
