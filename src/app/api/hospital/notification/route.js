import { NextResponse } from "next/server";

async function get(request) {
  try {
    // TODO: Implement notifications from database
    // For now, return empty array
    return NextResponse.json({
      success: true,
      notifications: [],
    }, { status: 200 })
  } catch (error) {
    console.error('❌ Notifications error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch notifications' 
    }, { status: 500 })
  }
}