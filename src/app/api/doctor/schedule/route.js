import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import HospitalAffiliation from '@/models/hospitalAffiliation'
import { requireRole } from '@/lib/apiAuth'

// --- Helper Functions ---

// Convert "HH:mm" string to minutes since midnight (e.g., "01:30" -> 90)
const toMinutes = (time) => {
  if (!time) return 0
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// Function to check for overlapping schedules across hospitals
async function checkCrossHospitalOverlap(doctorId, currentAffiliationId, newWeeklySchedule) {
  // Import HospitalAffiliation here to avoid circular imports
  const HospitalAffiliation = (await import('@/models/hospitalAffiliation')).default;
  
  // Fetch all other affiliations for this doctor
  const otherAffiliations = await HospitalAffiliation.find({
    doctorId,
    _id: { $ne: currentAffiliationId }, // Exclude the current affiliation
    status: 'APPROVED'
  }).populate('hospitalId', 'name');
  
  const conflicts = [];
  const currentDayMap = {};
  
  // Build a map of the proposed schedule for the current hospital
  if (newWeeklySchedule && Array.isArray(newWeeklySchedule)) {
    newWeeklySchedule.forEach(daySchedule => {
      if (daySchedule.slots && Array.isArray(daySchedule.slots)) {
        currentDayMap[daySchedule.day] = daySchedule.slots;
      }
    });
  }
  
  // Check against all other approved affiliations
  otherAffiliations.forEach(affiliation => {
    const otherSchedule = affiliation.weeklySchedule || [];
    
    // Check each day for potential conflicts
    otherSchedule.forEach(otherDaySchedule => {
      const day = otherDaySchedule.day;
      const otherSlots = otherDaySchedule.slots || [];
      
      // If the current hospital has slots on this day, check for overlaps
      if (currentDayMap[day] && currentDayMap[day].length > 0) {
        // Check each slot in the current proposed schedule against other hospital's slots
        currentDayMap[day].forEach(currentSlot => {
          otherSlots.forEach(otherSlot => {
            // Check if time ranges overlap
            const currentStart = toMinutes(currentSlot.start);
            const currentEnd = toMinutes(currentSlot.end);
            const otherStart = toMinutes(otherSlot.start);
            const otherEnd = toMinutes(otherSlot.end);
            
            // Two time ranges overlap if: (start1 < end2) AND (start2 < end1)
            if (currentStart < otherEnd && otherStart < currentEnd) {
              conflicts.push({
                day,
                currentSlot,
                otherSlot,
                otherHospital: affiliation.hospitalId?.name || 'Unknown Hospital',
                currentHospital: affiliation.hospitalId?.name || 'Current Hospital'
              });
            }
          });
        });
      }
    });
  });
  
  return conflicts;
}

// --- Routes ---

// ✅ GET - Fetch schedule + slot duration for a specific affiliation
export async function GET(req) {
  // 1. Auth Check
  const gate = await requireRole(['doctor'])
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  // 2. Validate Params
  const { searchParams } = new URL(req.url)
  const affiliationId = searchParams.get('affiliationId')

  if (!affiliationId) {
    return NextResponse.json({ error: 'affiliationId is required' }, { status: 400 })
  }

  await connectDB()

  try {
    // 3. Fetch Affiliation
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

    // 4. Return Data
    return NextResponse.json({ 
      success: true,
      schedule: {
        weekly: affiliation.weeklySchedule || [],
        exceptions: affiliation.dateOverrides || [],
        slotDuration: affiliation.slotDuration || 15 // Default 15 mins if not set
      }
    }, { status: 200 })

  } catch (e) {
    console.error('❌ Fetch schedule error:', e)
    return NextResponse.json({ 
      error: 'Failed to fetch schedule' 
    }, { status: 500 })
  }
}

// ✅ PATCH - Update schedule + slot duration
export async function PATCH(req) {
  // 1. Auth Check
  const gate = await requireRole(['doctor'])
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  // 2. Parse Body
  const body = await req.json()
  const { affiliationId, weekly, exceptions, slotDuration } = body || {}

  if (!affiliationId) {
    return NextResponse.json({ error: 'affiliationId is required' }, { status: 400 })
  }

  // 3. Basic Validation
  if (weekly && !Array.isArray(weekly)) {
    return NextResponse.json({ error: 'weekly schedule must be an array' }, { status: 400 })
  }

  await connectDB()

  try {
    // 4. Find Affiliation
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

    // 5. Update Slot Duration
    if (slotDuration !== undefined && slotDuration !== null) {
      const validDurations = [10, 15, 20, 30, 45, 60];
      if (!validDurations.includes(slotDuration)) {
        return NextResponse.json({ error: 'Invalid slot duration' }, { status: 400 });
      }
      affiliation.slotDuration = slotDuration;
    }

    // 6. Update Weekly Schedule with Robust Validation
    if (weekly) {
      const validDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
      
      for (const daySchedule of weekly) {
        if (!validDays.includes(daySchedule.day)) {
          return NextResponse.json({ error: `Invalid day: ${daySchedule.day}` }, { status: 400 })
        }

        if (daySchedule.slots && Array.isArray(daySchedule.slots)) {
          // Sort slots by start time using minute conversion
          const sortedSlots = [...daySchedule.slots].sort((a, b) => 
            toMinutes(a.start) - toMinutes(b.start)
          )
          
          for (let i = 0; i < sortedSlots.length; i++) {
            const slot = sortedSlots[i]
            
            // Format check (HH:mm)
            if (!slot.start.match(/^\d{2}:\d{2}$/) || !slot.end.match(/^\d{2}:\d{2}$/)) {
              return NextResponse.json({ error: 'Invalid time format (HH:mm)' }, { status: 400 })
            }

            const startMins = toMinutes(slot.start)
            const endMins = toMinutes(slot.end)

            // Logic check: Start < End
            if (startMins >= endMins) {
              return NextResponse.json({ error: `Start time (${slot.start}) must be before end time` }, { status: 400 })
            }
            
            // Overlap check: Compare with previous slot
            if (i > 0) {
              const prevSlot = sortedSlots[i - 1]
              const prevEndMins = toMinutes(prevSlot.end)

              // If current start is before previous end, they overlap
              if (startMins < prevEndMins) {
                return NextResponse.json({ 
                  error: `Overlapping slots on ${daySchedule.day}: ${prevSlot.start}-${prevSlot.end} overlaps with ${slot.start}-${slot.end}` 
                }, { status: 400 })
              }
            }
          }
        }
      }

      // Check for cross-hospital overlaps
      const crossHospitalConflicts = await checkCrossHospitalOverlap(gate.me._id, affiliationId, weekly);
      if (crossHospitalConflicts.length > 0) {
        const conflict = crossHospitalConflicts[0];
        return NextResponse.json({ 
          error: `Schedule conflicts with ${conflict.otherHospital} on ${conflict.day} (${conflict.otherSlot.start}-${conflict.otherSlot.end}). Please adjust your schedule.` 
        }, { status: 400 });
      }
      
      // If validation passes, map clean data to model
      affiliation.weeklySchedule = weekly.map(day => ({
        day: day.day,
        slots: (day.slots || []).map(slot => ({
          start: slot.start,
          end: slot.end,
          room: slot.room || ''
        }))
      }))
    }

    // 7. Update Exceptions (Date Overrides)
    if (exceptions) {
      if (!Array.isArray(exceptions)) {
        return NextResponse.json({ error: 'exceptions must be an array' }, { status: 400 })
      }

      affiliation.dateOverrides = exceptions.map(exc => ({
        date: exc.date,
        unavailable: exc.unavailable || false,
        reason: exc.reason || '',
        slots: (exc.slots || []).map(slot => ({
          start: slot.start,
          end: slot.end,
          room: slot.room || ''
        })),
        updatedBy: gate.me._id,
        updatedByRole: 'doctor',
        updatedAt: new Date()
      }))
    }

    // 8. Update Audit Fields
    affiliation.lastScheduleUpdatedAt = new Date()
    affiliation.lastScheduleUpdatedBy = gate.me._id
    affiliation.lastScheduleUpdatedByRole = 'doctor'

    await affiliation.save()

    console.log(`✅ Schedule updated for affiliation ${affiliationId} by doctor ${gate.me._id}`)

    return NextResponse.json({ 
      success: true,
      message: 'Schedule updated successfully',
      schedule: {
        weekly: affiliation.weeklySchedule,
        exceptions: affiliation.dateOverrides,
        slotDuration: affiliation.slotDuration
      }
    }, { status: 200 })

  } catch (e) {
    console.error('❌ Update schedule error:', e)
    return NextResponse.json({ 
      error: 'Failed to update schedule' 
    }, { status: 500 })
  }
}
