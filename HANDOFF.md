### Verification of Your API Keys & Supabase Database

  Your .env.local credentials have been verified and tested:

  1. Supabase Database: Connected and verified.
      • public.hospitals: Populated with Ishara Demo Hospital.
      • public.isl_clips: All 44 sign language clips and aliases are loaded in PostgreSQL.
  2. Supabase Storage:
      • The isl-clips storage bucket has been created as a public bucket.
  3. LiveKit Cloud:
      • Connected to wss://ishara-o5m31j5u.livekit.cloud. Token generation tested and verified.

  ──────
  ### Division of Remaining Next Steps (From milestone1.md)

  Based on milestone1.md, the remaining work is divided into 4 focused phases:
  ──────
  │ Diagram exceeds terminal width (505 > 150 cols)
  │ Displayed as code block. Widen terminal to view inline.

    flowchart TD
        subgraph Phase1 ["Phase 1: Real-Time Communication & LiveKit (P1)"]
            LK["Wire @livekit/components-react\n(Real 2-party WebRTC on Patient & Interpreter)"]
            RT["Enable multi-device Supabase Realtime\n(Sync across physical tablet and laptop)"]
        end

        subgraph Phase2 ["Phase 2: Vision Sign Recognition (P3)"]
            MP["Install @mediapipe/tasks-vision\n(Client-side WASM Hand Tracking)"]
            Cam["Live Landmark Skeleton Canvas on Tablet"]
            Clas["Gesture Classifier (Help, Pain, Yes, No, 1-5)"]
            TTS["Staff Station Audio TTS Readout"]
        end

        subgraph Phase3 ["Phase 3: Video Assets & Clip Playback (P2)"]
            Vid["Add sample demo MP4 assets to public/videos/ and Storage"]
            Play["Verify full speech-to-video playback loop"]
        end

        subgraph Phase4 ["Phase 4: Clinician Pairing & Polish"]
            QR["QR Code Bedside Pairing\n(Scan monitor to open patient tablet)"]
            Timer["60s Auto-fallback timer when paging interpreter"]
        end

        Phase1 --> Phase2
        Phase2 --> Phase3
        Phase3 --> Phase4
  ──────
  ### Phase 1: Real WebRTC Video Call & Cross-Device Sync (P1 Core)

  Goal: Replace mock video with real LiveKit 2-party WebRTC video streaming between two physical devices.

  1. Patient Tablet Video Component:
      • Embed <LiveKitRoom> inside app/patient/[sessionId]/page.tsx file:///home/vibhav/Projects/Ishara_VTSP/app/patient/[sessionId]/page.tsx so
      when the interpreter accepts, the tablet immediately streams camera and displays the remote interpreter.
  2. Interpreter Call View:
      • Replace the static card in app/interpreter/call/[sessionId]/page.tsx
      file:///home/vibhav/Projects/Ishara_VTSP/app/interpreter/call/[sessionId]/page.tsx with @livekit/components-react <VideoConference />.
  3. Multi-Device Realtime Verification:
      • Ensure the Supabase Realtime broadcast channels actively sync pictogram alerts across separate physical devices (e.g. an iPad on Wi-Fi and a
      laptop).

  ──────
  ### Phase 2: Client-Side Sign Language Detection (P3 Core)

  Goal: Enable the patient tablet camera to actually watch and detect signs in real time.

  1. MediaPipe Engine:
      • Install @mediapipe/tasks-vision and create lib/sign-recognition.ts using Google's GestureRecognizer WASM model.
  2. Camera Skeleton Overlay:
      • Create components/gesture-camera-modal.tsx with a live landmark tracking canvas (visual skeleton on fingers) and real-time confidence pill.
  3. Medical Gesture Set:
      • Classify core medical signs:
          • Open Palm / Wave → "Emergency / Help"
          • Fist → "Acute Pain"
          • Thumbs Up / Down → "Yes / No"
          • Fingers Extended → Number rating on Pain Scale (1 to 5).

  4. Staff Station Readout:
      • Stream recognized signs to app/dashboard/[sessionId]/page.tsx file:///home/vibhav/Projects/Ishara_VTSP/app/dashboard/[sessionId]/page.tsx
      and speak them aloud with window.speechSynthesis.
  ──────
  ### Phase 3: Video Clips & Playback (P2 Core)
  Goal: Replace the avatar fallback with actual video file playback.
  1. Video Assets:
      • Provide sample sign language demo clips in public/videos/ (e.g. chest-pain.mp4, we-are-helping.mp4, take-medicine.mp4).
  2. Storage Linking:
      • Verify that dictating a phrase on the Staff Station immediately autoplays the corresponding video on the Patient Tablet.

  ──────
  ### Phase 4: QR Pairing & Clinician Polish

  Goal: Impress the judges with frictionless hospital ergonomics.

  1. QR Code Pairing:
      • Show a QR code on the Staff Station for /patient/[sessionId] so doctors can point the tablet camera and pair instantly without typing URLs.
  2. 60s Auto-Fallback Timer:
      • If an interpreter is paged but doesn't answer within 60s, automatically alert staff and offer AI sign clips.

  ──────
