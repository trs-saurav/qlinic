// src/app/api/auth/set-oauth-role/route.js
// This endpoint stores the intended OAuth signup role temporarily
// Called by frontend before redirecting to OAuth provider

import { setOAuthRole } from '@/auth'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { email, role } = await req.json()

    if (!email || !role) {
      console.log('[SET_OAUTH_ROLE] Missing params:', { email: !!email, role: !!role })
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    // Store role temporarily (valid for 5 minutes)
    setOAuthRole(email, role)

    console.log(`[SET_OAUTH_ROLE] ✅ Stored role "${role}" for email "${email}"`)

    return NextResponse.json(
      { success: true, message: `Role "${role}" stored temporarily for "${email}"` },
      { status: 200 }
    )
  } catch (error) {
    console.error('[SET_OAUTH_ROLE] Error:', error)
    return NextResponse.json(
      { error: 'Failed to store role', details: error.message },
      { status: 500 }
    )
  }
}
