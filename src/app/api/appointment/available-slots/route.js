import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import HospitalAffiliation from '@/models/hospitalAffiliation'
import Appointment from '@/models/appointment'
import { startOfDay, endOfDay, format, parseISO } from 'date-fns'

// --- Helper Functions ---

// Convert "HH:mm" to minutes from midnight (e.g., "10:30" -> 630)
const toMinutes = (timeStr) => {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

// Convert minutes back to "HH:mm" (e.g., 630 -> "10:30")
const toTimeStr = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

// Format "HH:mm" to "10:30 AM" for display
const toDisplayTime = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number)
  const date = new Date()
  date.setHours(h, m)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const doctorId = searchParams.get('doctorId')
  const hospitalId = searchParams.get('hospitalId')
  const dateStr = searchParams.get('date') // Expected format: "YYYY-MM-DD"

  if (!doctorId || !hospitalId || !dateStr) {
    return NextResponse.json({ error: 'Missing parameters: doctorId, hospitalId, or date' }, { status: 400 })
  }

  await connectDB()

  try {
    // 1. Fetch Doctor's Affiliation (Schedule)
    const affiliation = await HospitalAffiliation.findOne({
      doctorId,
      hospitalId,
      status: 'APPROVED'
    })

    if (!affiliation) {
      console.log(`No approved affiliation found for Doc ${doctorId} at Hospital ${hospitalId}`)
      return NextResponse.json({ success: false, message: 'Doctor not available at this clinic' })
    }

    const { weeklySchedule, dateOverrides, slotDuration = 15 } = affiliation
    
    // Parse the date to get the day of the week (e.g., "MON")
    // We use 'date-fns' or standard JS date. 
    // IMPORTANT: Create date in UTC or correct locale to match "YYYY-MM-DD"
    const requestDate = new Date(dateStr)
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    const dayOfWeek = days[requestDate.getUTCDay()] // Using UTC to avoid timezone shifts on the day

    console.log(`Checking slots for: ${dateStr} (${dayOfWeek}), Duration: ${slotDuration} min`)

    // 2. Determine Working Hours
    let activeSlots = []

    // A. Check for specific Date Overrides (Exceptions)
    const override = dateOverrides?.find(o => o.date === dateStr)

    if (override) {
      if (override.unavailable) {
        return NextResponse.json({ success: true, availableSlots: [], message: 'Doctor is on leave' })
      }
      activeSlots = override.slots || []
      console.log('Using override slots:', activeSlots)
    } else {
      // B. Fallback to Weekly Schedule
      const daySchedule = weeklySchedule?.find(d => d.day === dayOfWeek)
      if (daySchedule) {
        activeSlots = daySchedule.slots || []
        console.log('Using weekly schedule slots:', activeSlots)
      } else {
        console.log(`No schedule found for ${dayOfWeek}`)
      }
    }

    if (activeSlots.length === 0) {
      return NextResponse.json({ success: true, availableSlots: [], message: 'No schedule for this day' })
    }

    // 3. Generate Time Slots
    let generatedSlots = []

    activeSlots.forEach(range => {
      const startMins = toMinutes(range.start)
      const endMins = toMinutes(range.end)

      for (let time = startMins; time < endMins; time += slotDuration) {
        // Ensure slot finishes before the end time
        if (time + slotDuration <= endMins) {
          generatedSlots.push(toTimeStr(time))
        }
      }
    })

    // 4. Filter Out Booked Slots
    const dayStart = startOfDay(new Date(dateStr))
    const dayEnd = endOfDay(new Date(dateStr))

    const existingAppointments = await Appointment.find({
      doctorId,
      hospitalId,
      scheduledTime: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ['CANCELLED', 'SKIPPED'] }
    }).select('scheduledTime')

    const bookedTimes = new Set(
      existingAppointments.map(appt => {
        const d = new Date(appt.scheduledTime)
        // Convert DB time back to "HH:mm"
        // Note: scheduledTime in DB is UTC. We need to convert it to local time implied by the request.
        // Or simpler: just match hours/minutes.
        const h = d.getHours().toString().padStart(2, '0')
        const m = d.getMinutes().toString().padStart(2, '0')
        return `${h}:${m}`
      })
    )

    console.log(`Found ${bookedTimes.size} existing bookings`)

    // 5. Final Result
    const finalSlots = generatedSlots
      .filter(time => !bookedTimes.has(time))
      .map(time => ({
        time,
        displayTime: toDisplayTime(time)
      }))

    return NextResponse.json({
      success: true,
      availableSlots: finalSlots
    })

  } catch (error) {
    console.error('Error calculating slots:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
