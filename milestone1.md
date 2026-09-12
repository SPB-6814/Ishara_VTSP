Here is the honest, complete, and unvarnished audit of every single piece of functionality across the entire codebase.
  ──────
  ## 1. The Core Truth: What is Real vs. Mocked
   Feature / Subsystem                       | Current State                | What Actually Happens Right Now
  -------------------------------------------|------------------------------|-------------------------------------------
   Sign Recognition (Camera watching patient | ❌ 0% Done (Not Implemented) | There is zero computer vision model in
   sign)                                     |                              | the codebase. No MediaPipe, no
                                             |                              | TensorFlow, no landmark detection. The
                                             |                              | camera does not detect any signs.
   P1 Live Video Call (Patient ↔             | ⚠️ Mocked / Visual Shell     | Shows your own webcam via local
   Interpreter)                              |                              | getUserMedia, but LiveKit WebRTC is not
                                             |                              | wired. The "Patient" tile is a static
                                             |                              | placeholder card. Video does not stream
                                             |                              | between two devices.
   P2 ISL Video Clips Playback               | ⚠️ Metadata Only (No Videos) | The Fuse.js fuzzy text search works, but
                                             |                              | there are zero .mp4 video files in the
                                             |                              | repo (public/videos/ is empty). The
                                             |                              | player triggers onError and displays an
                                             |                              | animated avatar placeholder.
   P0 Pictogram Grid (Alert to Staff)        | ⚠️ Works in 1 Browser Only   | Works with chime and instant alert
                                             |                              | between tabs on the same laptop (via
                                             |                              | browser BroadcastChannel), but will NOT
                                             |                              | transmit between 2 physical devices until
                                             |                              | Supabase Realtime keys are connected.
   Authentication (Hospital / Interpreter)   | ⚠️ Mocked / Bypass Only      | The "Demo Login" buttons work, but Magic
                                             |                              | Link email authentication is a simulated
                                             |                              | setTimeout(..., 800). /api/auth/callback
                                             |                              | has a // TODO.
   Database & Audit Trail                    | ⚠️ In-Memory Fallback        | The SQL tables are designed in
                                             |                              | supabase/migrations/, but since no
                                             |                              | database credentials exist in .env.local,
                                             |                              | all session data is saved in temporary
                                             |                              | in-memory JavaScript Maps and disappears
                                             |                              | on server reload.
  ──────
  ## 2. In-Depth Breakdown of Every Incomplete Part
  ### Gap 1: Sign Recognition (Patient Signs → Text on Screen)
  • What was asked: "How does the website detect signs now? What model are we using?"
  • The reality: It does not detect signs. In the kickoff prompt, this was categorized as P3 (Stretch) and was deferred
  because no trained ISL model was available.
  • What is required to make it work: We must integrate @mediapipe/tasks-vision (Google's WebAssembly hand gesture
  recognizer) to track 21 hand landmarks in real time through the tablet camera, map the gestures to medical triage
  needs (Help, Pain, Yes, No, 1–5), and stream the recognized text to the staff dashboard.
  ──────
  ### Gap 2: Live Video Call (LiveKit WebRTC)
  • Current code: app/interpreter/call/[sessionId]/page.tsx
  file:///home/vibhav/Projects/Ishara_VTSP/app/interpreter/call/[sessionId]/page.tsx
  • The reality: It is a static mockup.
      1. It renders a local <video> feed using raw navigator.mediaDevices.getUserMedia.
      2. It does not import @livekit/components-react (<LiveKitRoom />, <VideoConference />, <ParticipantTile />).
      3. The patient tablet doesn't even have a video call window—when the interpreter accepts, the patient page just
      has a button that opens /interpreter/call/[sessionId] in a new tab.
  • What is required to make it work:
      1. Wrap the call view in @livekit/components-react <LiveKitRoom> connected to LiveKit Cloud.
      2. Embed a two-way video component directly inside the patient tablet screen so the patient and interpreter can
      see and sign to each other in real time.

  ──────
  ### Gap 3: ISL Video Library (Clip Playback)
  • Current code: isl-video-player.tsx
  • The reality: The text matching works ("chest hurts" matches "chest-pain" with 95% confidence). However,
  public/videos/ has zero video files.
  • What is required to make it work: Either:
      1. Put actual video files in public/videos/*.mp4 (or upload to Supabase Storage isl-clips bucket).
      2. Or generate a clear, animated canvas/video avatar for the demo so judges see actual visual sign language
      demonstration rather than an error fallback.

  ──────
  ### Gap 4: Multi-Physical-Device Communication

  • Current code: use-session-realtime.ts
  • The reality: We used browser BroadcastChannel as a fallback. BroadcastChannel is restricted to the same browser
  instance on one machine. If you open the Patient Kiosk on an iPad and the Staff Dashboard on a laptop, they will not
  talk to each other without a live backend.
  • What is required to make it work:
      1. Either connect the real Supabase Realtime project (requires your teammate to give you NEXT_PUBLIC_SUPABASE_URL
      and ANON_KEY).
      2. Or run a lightweight internal WebSocket / PeerJS relay server so multi-device works over local Wi-Fi without
      needing cloud setup.

  ──────
  ### Gap 5: Magic Link Auth

  • Current code: page.tsx, route.ts
  • The reality: If someone types an email and clicks "Send Magic Link", it shows a fake success message using
  setTimeout. It does not send an email.
  • What is required to make it work: Wire supabase.auth.signInWithOtp({ email }) and exchange code in
  /auth/callback/route.ts.
  ──────
  ## 3. Recommended Plan of Action

  To have a 100% real, fully functional hackathon project (not simulated), here is the priority list to complete:

  1. Implement Real LiveKit 2-Party Video (P1):
      • Connect @livekit/components-react on both the Patient Tablet and Interpreter Portal so camera video and audio
      stream between devices.
  2. Add Real Sign Language Detection (P3):
      • Add @mediapipe/tasks-vision so the tablet camera actually detects hand signs (Help, Pain, Yes, No, Scale
      numbers) in real time.
  3. Populate Video Files for Clip Playback (P2):
      • Add demo video clips in public/videos/ so the video player actually plays real sign language clips.
  4. Enable Real Cross-Device Realtime (P0):
      • Connect Supabase Realtime credentials so an iPad and a laptop communicate over the network.
  5. Real Supabase Auth & DB:
      • Hook up the database and magic links once your teammate sends the Supabase keys.

  ──────
