import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function seed() {
  console.log('🚀 Starting Ishara Production Seed...')

  // 1. Hospital Organization
  const hospitalId = 'a0000000-0000-0000-0000-000000000001'
  const { error: hospError } = await supabase.from('hospitals').upsert(
    {
      id: hospitalId,
      name: 'Apollo Multi-Specialty Hospital (New Delhi)',
    },
    { onConflict: 'id' }
  )

  if (hospError) {
    console.error('Error upserting hospital:', hospError)
  } else {
    console.log('✅ Hospital: Apollo Multi-Specialty Hospital (New Delhi)')
  }

  // 2. Production Users (Doctors and Interpreters)
  const usersToSeed = [
    {
      email: 'dr.sharma@apollo.health',
      password: 'Ishara2026!',
      fullName: 'Dr. Rajesh Sharma (Emergency Medicine)',
      role: 'doctor',
      hospitalId: hospitalId,
    },
    {
      email: 'dr.verma@apollo.health',
      password: 'Ishara2026!',
      fullName: 'Dr. Anjali Verma (Critical Care)',
      role: 'doctor',
      hospitalId: hospitalId,
    },
    {
      email: 'ananya.isl@relay.org',
      password: 'Ishara2026!',
      fullName: 'Ananya Deshmukh (Certified ISL A-Grade)',
      role: 'interpreter',
      hospitalId: null,
      presenceStatus: 'available',
    },
    {
      email: 'vikram.isl@relay.org',
      password: 'Ishara2026!',
      fullName: 'Vikram Mehta (Certified ISL Medical)',
      role: 'interpreter',
      hospitalId: null,
      presenceStatus: 'offline',
    },
  ]

  for (const user of usersToSeed) {
    let userId: string | null = null

    // Check if user already exists in auth.users
    const { data: existingUserList } = await supabase.auth.admin.listUsers()
    const found = existingUserList?.users?.find((u) => u.email === user.email)

    if (found) {
      userId = found.id
      // Update password and metadata
      await supabase.auth.admin.updateUserById(userId, {
        password: user.password,
        email_confirm: true,
        user_metadata: { full_name: user.fullName, role: user.role },
      })
      console.log(`🔄 Updated existing user auth: ${user.email}`)
    } else {
      // Create user
      const { data: newUserData, error: createError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { full_name: user.fullName, role: user.role },
      })

      if (createError) {
        console.error(`Error creating ${user.email}:`, createError)
        continue
      }
      userId = newUserData.user.id
      console.log(`✅ Created user auth: ${user.email}`)
    }

    if (userId) {
      // Upsert into public.profiles
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: userId,
          role: user.role,
          full_name: user.fullName,
          hospital_id: user.hospitalId,
        },
        { onConflict: 'id' }
      )

      if (profileError) {
        console.error(`Error upserting profile for ${user.email}:`, profileError)
      } else {
        console.log(`✅ Profile: ${user.fullName} (${user.role})`)
      }

      // If interpreter, upsert presence
      if (user.role === 'interpreter') {
        const { error: presError } = await supabase.from('interpreter_presence').upsert(
          {
            interpreter_id: userId,
            status: user.presenceStatus || 'available',
            last_heartbeat: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'interpreter_id' }
        )

        if (presError) {
          console.error(`Error upserting presence for ${user.email}:`, presError)
        } else {
          console.log(`✅ Interpreter Presence: ${user.email} -> ${user.presenceStatus}`)
        }
      }
    }
  }

  // 3. Initial Production Bedside Patients (Sessions)
  const initialSessions = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      hospital_id: hospitalId,
      patient_display_name: 'Bed 4A - Ramesh Kumar (ISL)',
      status: 'active',
      active_mode: 'pictogram',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      hospital_id: hospitalId,
      patient_display_name: 'ICU Bed 2 - Sunita Patel (Deaf/Mute)',
      status: 'active',
      active_mode: 'pictogram',
    },
  ]

  for (const session of initialSessions) {
    const { error: sessError } = await supabase.from('sessions').upsert(session, { onConflict: 'id' })
    if (sessError) {
      console.error(`Error upserting session ${session.patient_display_name}:`, sessError)
    } else {
      console.log(`✅ Active Patient Session: ${session.patient_display_name}`)
    }
  }

  console.log('\n🎉 Production Seed Finished Successfully!')
  console.log('----------------------------------------------------')
  console.log('Doctor Login:      dr.sharma@apollo.health  / Ishara2026!')
  console.log('Doctor Login 2:    dr.verma@apollo.health   / Ishara2026!')
  console.log('Interpreter Login: ananya.isl@relay.org     / Ishara2026!')
  console.log('Bedside Tablet:    http://localhost:3000/patient/00000000-0000-0000-0000-000000000001')
  console.log('----------------------------------------------------')
}

seed().catch(console.error)
