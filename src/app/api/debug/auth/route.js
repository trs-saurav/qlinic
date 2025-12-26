import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(req) {
  const { userId, sessionId } = await auth()  // ✅ await

  const cookieHeader = req.headers.get('cookie') || ''
  const hasSessionCookie = cookieHeader.includes('__session=')

  return NextResponse.json(
    { userId, sessionId, hasSessionCookie, cookieHeaderLength: cookieHeader.length },
    { status: 200 }
  )
}
