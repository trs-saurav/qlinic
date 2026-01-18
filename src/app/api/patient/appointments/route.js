import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import  connectDB  from '@/config/db'
import User from '@/models/user'
import Appointment from '@/models/appointment'
import FamilyMember from '@/models/familyMember'
import Hospital from '@/models/hospital'

export async function GET(req) {
  console.log('🔵 Patient Appointments GET called')
  
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify user is a patient
    if (user.role !== 'user') {
      return NextResponse.json({ 
        error: 'Access denied. Patient role required.' 
      }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const familyMemberId = searchParams.get('familyMemberId');
    
    // Build query
    let query = {};
    if (familyMemberId && familyMemberId !== 'all') {
      // Verify that the family member belongs to this user
      const familyMember = await FamilyMember.findOne({
        _id: familyMemberId,
        userId: user._id,
        isActive: true
      });
      
      if (!familyMember) {
        return NextResponse.json({ error: 'Family member not found or unauthorized' }, { status: 404 });
      }
      query.patientId = familyMemberId;

    } else if (familyMemberId === 'all') {
      const familyMembers = await FamilyMember.find({ userId: user._id, isActive: true }).select('_id');
      const familyMemberIds = familyMembers.map(m => m._id);
      query.patientId = { $in: [user._id, ...familyMemberIds] };

    } else { // 'self' or null
      query.patientId = user._id;
    }
    
    const appointments = await Appointment.find(query)
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName doctorProfile profileImage')
      .populate('hospitalId', 'name address contactDetails')
      .sort({ scheduledTime: -1 })

    console.log('✅ Fetched appointments:', appointments.length)

    return NextResponse.json({ 
      success: true,
      appointments: appointments || []
    })

  } catch (error) {
    console.error('❌ Error fetching appointments:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function POST(req) {
  console.log('🔵 Patient Appointments POST called')
  
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify user is a patient
    if (user.role !== 'user') {
      return NextResponse.json({ 
        error: 'Access denied. Patient role required.' 
      }, { status: 403 })
    }

    const body = await req.json()
    const { doctorId, hospitalId, familyMemberId, scheduledTime, reason, type } = body

    // Validate required fields
    if (!doctorId || !hospitalId || !scheduledTime) {
      return NextResponse.json({ 
        error: 'Doctor, hospital, and scheduled time are required' 
      }, { status: 400 })
    }

    // Use family member if provided, otherwise use current user
    const patientId = familyMemberId || user._id
    const patientModel = familyMemberId ? 'FamilyMember' : 'User'

    // Calculate token number for the day
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    
    const todayAppointments = await Appointment.countDocuments({
      hospitalId,
      doctorId,
      scheduledTime: { 
        $gte: todayStart,
        $lte: todayEnd
      }
    })

    const tokenNumber = todayAppointments + 1

    // Create appointment
    const appointment = await Appointment.create({
      patientId,
      patientModel,
      doctorId,
      hospitalId,
      scheduledTime: new Date(scheduledTime),
      reason: reason || 'General consultation',
      type: type || 'SCHEDULED',
      status: 'BOOKED',
      tokenNumber,
      paymentStatus: 'PENDING',
      bookingSource: 'WEB',
      createdBy: user._id,
    })

    // Populate appointment details
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'firstName lastName email phoneNumber patientProfile')
      .populate('doctorId', 'firstName lastName doctorProfile profileImage')
      .populate('hospitalId', 'name address contactDetails')

    console.log('✅ Appointment created:', appointment._id)

    return NextResponse.json({ 
      success: true, 
      appointment: populatedAppointment 
    })

  } catch (error) {
    console.error('❌ Error creating appointment:', error)
    return NextResponse.json({ 
      error: 'Failed to create appointment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
