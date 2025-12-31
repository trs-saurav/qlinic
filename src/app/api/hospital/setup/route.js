import { auth } from "@/auth"
import connectDB from "@/config/db"
import User from "@/models/user"
import Hospital from "@/models/hospital"
import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const session = await auth()

    if (!session?.user) {
      console.log('❌ No session found')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    console.log('🏥 Hospital setup request from:', session.user.email)

    await connectDB()

    const user = await User.findById(userId)

    if (!user) {
      console.log('❌ User not found in database')
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.role !== "hospital_admin") {
      console.log('❌ User is not hospital admin:', user.role)
      return NextResponse.json(
        { error: "Not authorized as hospital admin" },
        { status: 403 }
      )
    }

    // ✅ Check if hospital already exists
    if (user.hospitalAdminProfile?.hospitalId) {
      const existing = await Hospital.findById(user.hospitalAdminProfile.hospitalId)
      if (existing) {
        console.log('✅ Hospital already exists:', existing.name)
        return NextResponse.json(
          { 
            success: true,
            message: "Hospital already exists",
            hospital: existing.toObject(),
            redirect: "/hospital-admin"
          },
          { status: 200 }
        )
      } else {
        // Cleanup invalid reference
        console.log('⚠️ Cleaning up invalid hospital reference')
        user.hospitalAdminProfile.hospitalId = undefined
        await user.save()
      }
    }

    const body = await req.json()
    const { 
      name, 
      phone, 
      email, 
      city, 
      state, 
      street, 
      pincode, 
      description,
      type,
      registrationNumber 
    } = body

    // Validate required fields
    if (!name || !phone || !city || !state) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: "Name, phone, city, and state are required" },
        { status: 400 }
      )
    }

    // Validate phone format
    const cleanPhone = phone.replace(/\D/g, '')
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: "Invalid phone number format. Must be a valid 10-digit Indian mobile number" },
        { status: 400 }
      )
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        )
      }
    }

    console.log('📝 Creating hospital:', name)

    // ✅ Map hospital type to correct enum value
    const hospitalTypeMap = {
      'government': 'Government',
      'private': 'Private',
      'trust': 'Trust',
      'corporate': 'Corporate',
      'multi-specialty': 'Multi-Specialty',
      'super-specialty': 'Super-Specialty',
    }

    const hospitalType = hospitalTypeMap[type?.toLowerCase()] || 'Private'

    // ✅ Create hospital with correct data structure
    const hospital = new Hospital({
      name: name.trim(),
      type: hospitalType, // ✅ Use correct enum value
      registrationNumber: registrationNumber?.trim() || undefined,
      description: description?.trim() || "",
      
      contactDetails: {
        phone: cleanPhone,
        email: email?.trim() || user.email,
      },
      
      address: {
        street: street?.trim() || "",
        city: city.trim(),
        state: state.trim(),
        country: "India",
        pincode: pincode?.replace(/\D/g, '') || "",
      },
      
      operatingHours: {
        Monday: { open: "09:00", close: "18:00", isOpen: true },
        Tuesday: { open: "09:00", close: "18:00", isOpen: true },
        Wednesday: { open: "09:00", close: "18:00", isOpen: true },
        Thursday: { open: "09:00", close: "18:00", isOpen: true },
        Friday: { open: "09:00", close: "18:00", isOpen: true },
        Saturday: { open: "09:00", close: "14:00", isOpen: true },
        Sunday: { open: "09:00", close: "18:00", isOpen: false },
        isOpen24x7: false,
      },
      
      // Beds
      totalBeds: 0,
      availableBeds: 0,
      icuBeds: 0,
      emergencyBeds: 0,
      
      // Fees
      consultationFee: {
        general: 0,
        specialist: 0,
        emergency: 0,
      },
      emergencyFee: 0,
      
      // ✅ Initialize arrays as empty arrays (not undefined)
      departments: [],
      specialties: [],
      facilities: [],
      amenities: [],
      accreditations: [],
      emergencyServices: [], // ✅ This is an array, not boolean
      insurance: [],
      
      // Media
      logo: undefined,
      images: [],
      
      // Admin
      createdBy: user._id,
      adminUsers: [user._id],
      
      // Status
      isActive: true,
      isVerified: false,
      isProfileComplete: false,
      status: 'active',
    })

    await hospital.save()

    console.log('✅ Hospital created with ID:', hospital._id)

    // ✅ Update user with hospital ID
    user.hospitalAdminProfile = {
      hospitalId: hospital._id,
      designation: "Administrator",
      joinedAt: new Date(),
      permissions: {
        canManageDoctors: true,
        canManageStaff: true,
        canManageInventory: true,
        canViewReports: true,
        canManageSettings: true,
      },
    }

    user.isProfileComplete = false
    await user.save()

    // ✅ Verify it was saved
    const updatedUser = await User.findById(user._id).select('hospitalAdminProfile')
    console.log('✅ User updated. Hospital ID:', updatedUser.hospitalAdminProfile?.hospitalId)

    return NextResponse.json(
      {
        success: true,
        message: "Hospital created successfully",
        hospital: {
          _id: hospital._id.toString(),
          name: hospital.name,
          type: hospital.type,
          address: hospital.address,
          contactDetails: {
            phone: hospital.contactDetails.phone,
            email: hospital.contactDetails.email,
          },
        },
        redirect: "/hospital-admin"
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("❌ Hospital setup error:", error)
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message)
      return NextResponse.json(
        {
          error: "Validation failed",
          details: messages.join(', '),
          fields: Object.keys(error.errors)
        },
        { status: 400 }
      )
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return NextResponse.json(
        {
          error: `A hospital with this ${field} already exists`,
          details: error.message,
        },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      {
        error: "Failed to create hospital",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// ✅ GET method to check setup status
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    await connectDB()

    const user = await User.findById(userId).select('role hospitalAdminProfile')

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.role !== "hospital_admin") {
      return NextResponse.json(
        { error: "Not authorized as hospital admin" },
        { status: 403 }
      )
    }

    const hasHospital = !!user.hospitalAdminProfile?.hospitalId
    let hospital = null

    if (hasHospital) {
      hospital = await Hospital.findById(user.hospitalAdminProfile.hospitalId)
        .select('name type address contactDetails isProfileComplete isVerified status')
    }

    return NextResponse.json(
      {
        success: true,
        hasHospital,
        hospital: hospital ? {
          _id: hospital._id.toString(),
          name: hospital.name,
          type: hospital.type,
          address: hospital.address,
          contactDetails: hospital.contactDetails,
          isProfileComplete: hospital.isProfileComplete,
          isVerified: hospital.isVerified,
          status: hospital.status,
        } : null,
        needsSetup: !hasHospital,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("❌ GET setup status error:", error)
    return NextResponse.json(
      {
        error: "Failed to check setup status",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
