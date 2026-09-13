import { matchClipWithGemini } from '../lib/gemini-isl'

async function runTests() {
  console.log('Testing Gemini Semantic Clip Matcher (gemini-flash-lite-latest)...')

  const testCases = [
    {
      query: 'Please swallow these antibiotic pills right now',
      expectedKey: 'take-medicine',
      description: 'Medical variation (antibiotic pills)',
    },
    {
      query: 'Don\'t worry, you are in very safe hands with our care team',
      expectedKey: 'you-are-safe',
      description: 'Conversational reassurance',
    },
    {
      query: 'Aap bilkul mat hiliye, seedhe rahiye',
      expectedKey: 'stay-still',
      description: 'Hinglish command (stay still)',
    },
    {
      query: 'Kya aapke parivaar se koi yahan hospital mein hai?',
      expectedKey: 'family-here',
      description: 'Hindi question (family here)',
    },
    {
      query: 'Do NOT take this medication right now',
      expectedKey: null,
      description: 'Medical safety contradiction (must not match)',
    },
    {
      query: 'It is raining heavily outside this afternoon',
      expectedKey: null,
      description: 'Unrelated chatter (must not match)',
    },
  ]

  let passed = 0

  for (const tc of testCases) {
    console.log(`\n--- Test: ${tc.description} ---`)
    console.log(`Query: "${tc.query}"`)

    const result = await matchClipWithGemini(tc.query)

    if (tc.expectedKey) {
      if (result && result.clip.key === tc.expectedKey) {
        console.log(`✅ PASS: Matched "${result.clip.key}" (score: ${result.score}, reasoning: ${result.reasoning})`)
        passed++
      } else {
        console.error(`❌ FAIL: Expected "${tc.expectedKey}", got "${result?.clip.key || 'null'}"`)
      }
    } else {
      if (!result) {
        console.log(`✅ PASS: Correctly rejected match (returned null)`)
        passed++
      } else {
        console.error(`❌ FAIL: Expected null, but matched "${result.clip.key}"`)
      }
    }
  }

  console.log(`\n========================================`)
  console.log(`Results: ${passed} / ${testCases.length} tests passed`)
  console.log(`========================================`)
  if (passed !== testCases.length) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error(err)
  process.exit(1)
})
