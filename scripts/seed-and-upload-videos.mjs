import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Load environment variables from .env or .env.local
dotenv.config({ path: path.join(rootDir, '.env') })
dotenv.config({ path: path.join(rootDir, '.env.local') })

const CLIPS = [
  // Emergency (P0)
  { key: 'chest-pain', label: 'Chest pain', file: 'chest-pain.mp4', category: 'Emergency' },
  { key: 'cant-breathe', label: "Can't breathe", file: 'cant-breathe.mp4', category: 'Emergency' },
  { key: 'im-dizzy', label: "I'm dizzy", file: 'im-dizzy.mp4', category: 'Emergency' },
  { key: 'feel-very-sick', label: 'I feel very sick', file: 'feel-very-sick.mp4', category: 'Emergency' },
  { key: 'call-doctor-now', label: 'Call doctor now', file: 'call-doctor-now.mp4', category: 'Emergency' },
  { key: 'emergency', label: 'Emergency', file: 'emergency.mp4', category: 'Emergency' },
  { key: 'help-me', label: 'Help me', file: 'help-me.mp4', category: 'Emergency' },

  // Pain (P0)
  { key: 'pain-level', label: 'Pain level 1-10', file: 'pain-level.mp4', category: 'Pain' },
  { key: 'head-hurts', label: 'My head hurts', file: 'head-hurts.mp4', category: 'Pain' },
  { key: 'stomach-hurts', label: 'My stomach hurts', file: 'stomach-hurts.mp4', category: 'Pain' },
  { key: 'chest-hurts', label: 'My chest hurts', file: 'chest-hurts.mp4', category: 'Pain' },
  { key: 'back-hurts', label: 'My back hurts', file: 'back-hurts.mp4', category: 'Pain' },
  { key: 'pain-started-now', label: 'Pain started now', file: 'pain-started-now.mp4', category: 'Pain' },

  // Allergies (P0)
  { key: 'i-have-allergy', label: 'I have allergy', file: 'i-have-allergy.mp4', category: 'Allergies' },
  { key: 'allergic-penicillin', label: 'Allergic to penicillin', file: 'allergic-penicillin.mp4', category: 'Allergies' },
  { key: 'allergic-aspirin', label: 'Allergic to aspirin', file: 'allergic-aspirin.mp4', category: 'Allergies' },
  { key: 'allergic-latex', label: 'Allergic to latex', file: 'allergic-latex.mp4', category: 'Allergies' },
  { key: 'no-known-allergy', label: 'No known allergy', file: 'no-known-allergy.mp4', category: 'Allergies' },

  // Basic needs (P1)
  { key: 'water', label: 'Water', file: 'water.mp4', category: 'Basic needs' },
  { key: 'toilet', label: 'Toilet', file: 'toilet.mp4', category: 'Basic needs' },
  { key: 'cold', label: 'Cold', file: 'cold.mp4', category: 'Basic needs' },
  { key: 'hot', label: 'Hot', file: 'hot.mp4', category: 'Basic needs' },
  { key: 'blanket', label: 'Blanket', file: 'blanket.mp4', category: 'Basic needs' },
  { key: 'hungry', label: 'Hungry', file: 'hungry.mp4', category: 'Basic needs' },
  { key: 'nausea', label: 'Nausea', file: 'nausea.mp4', category: 'Basic needs' },
  { key: 'vomit', label: 'Vomit', file: 'vomit.mp4', category: 'Basic needs' },

  // Medical history (P1)
  { key: 'diabetic', label: 'Diabetic', file: 'diabetic.mp4', category: 'Medical history' },
  { key: 'heart-condition', label: 'Heart condition', file: 'heart-condition.mp4', category: 'Medical history' },
  { key: 'high-blood-pressure', label: 'High blood pressure', file: 'high-blood-pressure.mp4', category: 'Medical history' },
  { key: 'pregnant', label: 'Pregnant', file: 'pregnant.mp4', category: 'Medical history' },
  { key: 'surgery-before', label: 'Surgery before', file: 'surgery-before.mp4', category: 'Medical history' },
  { key: 'blood-type', label: 'Blood type', file: 'blood-type.mp4', category: 'Medical history' },

  // Doctor -> patient (P1)
  { key: 'you-are-safe', label: 'You are safe', file: 'you-are-safe.mp4', category: 'Doctor -> patient' },
  { key: 'we-are-helping', label: 'We are helping you', file: 'we-are-helping.mp4', category: 'Doctor -> patient' },
  { key: 'do-you-understand', label: 'Do you understand?', file: 'do-you-understand.mp4', category: 'Doctor -> patient' },
  { key: 'take-medicine', label: 'Take this medicine', file: 'take-medicine.mp4', category: 'Doctor -> patient' },
  { key: 'stay-still', label: 'Stay still', file: 'stay-still.mp4', category: 'Doctor -> patient' },
  { key: 'relax', label: 'Relax', file: 'relax.mp4', category: 'Doctor -> patient' },
  { key: 'good', label: 'Good', file: 'good.mp4', category: 'Doctor -> patient' },

  // Consent (P2)
  { key: 'do-you-agree', label: 'Do you agree?', file: 'do-you-agree.mp4', category: 'Consent' },
  { key: 'sign-here', label: 'Sign here', file: 'sign-here.mp4', category: 'Consent' },
  { key: 'need-to-do-test', label: 'We need to do a test', file: 'need-to-do-test.mp4', category: 'Consent' },
  { key: 'this-will-help', label: 'This will help you', file: 'this-will-help.mp4', category: 'Consent' },
  { key: 'family-here', label: 'Do you have family here?', file: 'family-here.mp4', category: 'Consent' },
]

async function run() {
  console.log('🎥 Step 1: Ensuring public/videos directory exists...')
  const videosDir = path.join(rootDir, 'public', 'videos')
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true })
  }

  console.log('⬇️ Step 2: Fetching base H.264/AAC sample video template...')
  const sampleUrl = 'https://www.w3schools.com/html/mov_bbb.mp4'
  const res = await fetch(sampleUrl)
  if (!res.ok) {
    throw new Error(`Failed to download template video: ${res.statusText}`)
  }
  const arrayBuffer = await res.arrayBuffer()
  const videoBuffer = Buffer.from(arrayBuffer)
  console.log(`✓ Template video downloaded (${(videoBuffer.length / 1024).toFixed(1)} KB)`)

  console.log(`📁 Step 3: Populating all 44 video files in public/videos/...`)
  for (const clip of CLIPS) {
    const dest = path.join(videosDir, clip.file)
    fs.writeFileSync(dest, videoBuffer)
  }
  console.log(`✓ All 44 files created in public/videos/*.mp4`)

  // Upload to Supabase Storage
  console.log('☁️ Step 4: Connecting to Supabase Storage...')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase credentials not found in environment. Skipping cloud upload.')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const bucket = 'isl-clips'

  // Verify bucket
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets()
  if (bErr) {
    console.error('Bucket listing error:', bErr)
  } else {
    const exists = buckets?.some((b) => b.name === bucket)
    if (!exists) {
      console.log(`Creating public bucket "${bucket}"...`)
      await supabase.storage.createBucket(bucket, { public: true })
    }
  }

  console.log(`🚀 Step 5: Uploading 44 video clips to Supabase Storage bucket "${bucket}"...`)
  let uploadedCount = 0

  for (let i = 0; i < CLIPS.length; i++) {
    const clip = CLIPS[i]
    process.stdout.write(`   [${i + 1}/44] Uploading ${clip.file}... `)
    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(clip.file, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true,
      })

    if (upErr) {
      console.log(`FAILED: ${upErr.message}`)
    } else {
      uploadedCount++
      console.log('OK')
    }
  }

  console.log(`\n🎉 Completed! ${uploadedCount}/44 clips successfully uploaded to Supabase Storage "${bucket}".`)
}

run().catch((err) => {
  console.error('Error during video seeding:', err)
  process.exit(1)
})
