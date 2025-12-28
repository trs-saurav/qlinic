import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import HospitalAffiliation from '@/models/hospitalAffiliation'
import { requireRole } from '@/lib/apiAuth'

// ✅ GET - Fetch schedule for specific hospital affiliation
export async function GET(req) {
  const gate = await requireRole(['doctor'])
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { searchParams } = new URL(req.url)
  const affiliationId = searchParams.get('affiliationId')

  if (!affiliationId) {
    return NextResponse.json({ error: 'affiliationId is required' }, { status: 400 })
  }

  await connectDB()

  try {
    // Find affiliation and verify it belongs to this doctor
    const affiliation = await HospitalAffiliation.findOne({
      _id: affiliationId,
      doctorId: gate.me._id,
      status: 'APPROVED'
    })

    if (!affiliation) {
      return NextResponse.json({ 
        error: 'Affiliation not found or not approved' 
      }, { status: 404 })
    }

    // Return schedule (mapped to match frontend expectations)
    const schedule = {
      weekly: affiliation.weeklySchedule || [],
      exceptions: affiliation.dateOverrides || []
    }

    return NextResponse.json({ schedule }, { status: 200 })

  } catch (e) {
    console.error('❌ Fetch schedule error:', e)
    return NextResponse.json({ 
      error: 'Failed to fetch schedule' 
    }, { status: 500 })
  }
}

// ✅ PATCH - Update schedule for specific hospital affiliation
export async function PATCH(req) {
  const gate = await requireRole(['doctor'])
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const body = await req.json()
  const { affiliationId, weekly, exceptions } = body || {}

  if (!affiliationId) {
    return NextResponse.json({ error: 'affiliationId is required' }, { status: 400 })
  }

  if (!Array.isArray(weekly)) {
    return NextResponse.json({ error: 'weekly schedule is required' }, { status: 400 })
  }

  await connectDB()

  try {
    // Find affiliation and verify ownership
    const affiliation = await HospitalAffiliation.findOne({
      _id: affiliationId,
      doctorId: gate.me._id,
      status: 'APPROVED'
    })

    if (!affiliation) {
      return NextResponse.json({ 
        error: 'Affiliation not found or not approved' 
      }, { status: 404 })
    }

    // Validate weekly schedule structure
    const validDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    
    for (const daySchedule of weekly) {
      if (!validDays.includes(daySchedule.day)) {
        return NextResponse.json({ 
          error: `Invalid day: ${daySchedule.day}` 
        }, { status: 400 })
      }

      // Validate slots
      if (daySchedule.slots && Array.isArray(daySchedule.slots)) {
        for (const slot of daySchedule.slots) {
          if (!slot.start || !slot.end) {
            return NextResponse.json({ 
              error: 'Each slot must have start and end time' 
            }, { status: 400 })
          }

          // Validate time format (HH:mm)
          if (!slot.start.match(/^\d{2}:\d{2}$/) || !slot.end.match(/^\d{2}:\d{2}$/)) {
            return NextResponse.json({ 
              error: 'Invalid time format. Use HH:mm (e.g., 09:00)' 
            }, { status: 400 })
          }

          // Validate start < end
          if (slot.start >= slot.end) {
            return NextResponse.json({ 
              error: `Start time must be before end time (${slot.start} >= ${slot.end})` 
            }, { status: 400 })
          }
        }

        // Check for overlapping slots on same day
        const slots = daySchedule.slots.sort((a, b) => a.start.localeCompare(b.start))
        for (let i = 0; i < slots.length - 1; i++) {
          if (slots[i].end > slots[i + 1].start) {
            return NextResponse.json({ 
              error: `Overlapping slots on ${daySchedule.day}: ${slots[i].start}-${slots[i].end} overlaps with ${slots[i + 1].start}-${slots[i + 1].end}` 
            }, { status: 400 })
          }
        }
      }
    }

    // Validate exceptions (dateOverrides)
    if (exceptions && Array.isArray(exceptions)) {
      for (const exc of exceptions) {
        if (!exc.date) {
          return NextResponse.json({ 
            error: 'Each exception must have a date' 
          }, { status: 400 })
        }

        // Validate date format (YYYY-MM-DD)
        if (!exc.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return NextResponse.json({ 
            error: `Invalid date format: ${exc.date}. Use YYYY-MM-DD` 
          }, { status: 400 })
        }
      }
    }

    // Update the affiliation schedule with proper field names
    affiliation.weeklySchedule = weekly.map(day => ({
      day: day.day,
      slots: (day.slots || []).map(slot => ({
        start: slot.start,
        end: slot.end,
        room: slot.room || ''
      }))
    }))

    affiliation.dateOverrides = (exceptions || []).map(exc => ({
      date: exc.date,
      unavailable: exc.unavailable || false,
      reason: exc.reason || '',
      slots: exc.slots || [],
      updatedBy: gate.me._id,
      updatedByRole: 'doctor',
      updatedAt: new Date()
    }))

    // Update audit fields
    affiliation.lastScheduleUpdatedAt = new Date()
    affiliation.lastScheduleUpdatedBy = gate.me._id
    affiliation.lastScheduleUpdatedByRole = 'doctor'

    await affiliation.save()

    console.log('✅ Schedule updated:', {
      affiliationId: affiliation._id,
      doctor: gate.me._id,
      weeklySlots: affiliation.weeklySchedule.reduce((sum, day) => sum + (day.slots?.length || 0), 0),
      exceptions: affiliation.dateOverrides.length
    })

    return NextResponse.json({ 
      message: 'Schedule updated successfully',
      schedule: {
        weekly: affiliation.weeklySchedule,
        exceptions: affiliation.dateOverrides
      }
    }, { status: 200 })

  } catch (e) {
    console.error('❌ Update schedule error:', e)
    
    if (e.name === 'ValidationError') {
      return NextResponse.json({ 
        error: 'Validation error: ' + e.message 
      }, { status: 400 })
    }

    if (e.code === 11000) {
      return NextResponse.json({ 
        error: 'Duplicate affiliation detected' 
      }, { status: 409 })
    }

    return NextResponse.json({ 
      error: 'Failed to update schedule',
      details: process.env.NODE_ENV === 'development' ? e.message : undefined
    }, { status: 500 })
  }
}
