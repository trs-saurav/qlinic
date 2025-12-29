// app/api/hospital/notifications/route.js
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Implement notifications from database
    // For now, return empty array
    return NextResponse.json({
      notifications: [],
      unreadCount: 0
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Notifications error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch notifications' 
    }, { status: 500 })
  }
}
