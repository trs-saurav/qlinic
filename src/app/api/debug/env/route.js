import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasPublishable: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    hasSecret: !!process.env.CLERK_SECRET_KEY,
    pubPrefix: (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '').slice(0, 10),
    secretPrefix: (process.env.CLERK_SECRET_KEY || '').slice(0, 10),
  })
}
