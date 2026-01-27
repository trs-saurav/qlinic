// src/app/api/hospital/setup/route.js
import { auth } from "@/auth"
import connectDB from "@/config/db"
import User from "@/models/user"  // ✅ Capital U
import Hospital from "@/models/hospital"  // ✅ Capital H
import HospitalAdminProfile from "@/models/HospitalAdminProfile"
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

    // ✅ Check if profile exists
    const existingProfile = await HospitalAdminProfile.findOne({ userId: user._id })
    
    if (!existingProfile) {
      console.log('❌ HospitalAdminProfile not found')
      return NextResponse.json(
        { error: "Admin profile not found. Please contact support." },
        { status: 404 }
      )
    }
    
    if (existingProfile.hospitalId) {
      const existing = await Hospital.findById(existingProfile.hospitalId)
      if (existing) {
        console.log('✅ Hospital already exists:', existing.name)
        return NextResponse.json(
          { 
            success: true,
            message: "Hospital already exists",
            hospital: {
              _id: existing._id.toString(),
              name: existing.name,
              type: existing.type,
              address: existing.address,
              contactDetails: existing.contactDetails,
            },
            redirect: "/hospital"
          },
          { status: 200 }
        )
      } else {
        console.log('⚠️ Cleaning up invalid hospital reference')
        existingProfile.hospitalId = null
        await existingProfile.save()
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
      registrationNumber,
      coordinates  // ✅ Accept coordinates from frontend
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

    // ✅ Validate coordinates if provided
    if (coordinates) {
      const { latitude, longitude } = coordinates
      
      if (latitude !== undefined && latitude !== null && latitude !== '') {
        const lat = parseFloat(latitude)
        if (isNaN(lat) || lat < -90 || lat > 90) {
          return NextResponse.json(
            { error: "Invalid latitude. Must be between -90 and 90" },
            { status: 400 }
          )
        }
      }
      
      if (longitude !== undefined && longitude !== null && longitude !== '') {
        const lng = parseFloat(longitude)
        if (isNaN(lng) || lng < -180 || lng > 180) {
          return NextResponse.json(
            { error: "Invalid longitude. Must be between -180 and 180" },
            { status: 400 }
          )
        }
      }
    }

    console.log('📝 Creating hospital:', name)

    // Map hospital type to correct enum value
    const hospitalTypeMap = {
      'government': 'Government',
      'private': 'Private',
      'trust': 'Trust',
      'corporate': 'Corporate',
      'multi-specialty': 'Multi-Specialty',
      'super-specialty': 'Super-Specialty',
    }

    const hospitalType = hospitalTypeMap[type?.toLowerCase()] || 'Private'

    // ✅ Prepare address object with coordinates if provided
    const addressData = {
      street: street?.trim() || "",
      city: city.trim(),
      state: state.trim(),
      country: "India",
      pincode: pincode?.replace(/\D/g, '') || "",
    }

    // ✅ Add coordinates if valid values provided
    if (coordinates?.latitude && coordinates?.longitude) {
      const lat = parseFloat(coordinates.latitude)
      const lng = parseFloat(coordinates.longitude)
      
      if (!isNaN(lat) && !isNaN(lng)) {
        addressData.coordinates = {
          latitude: lat,
          longitude: lng
        }
        console.log('📍 Coordinates added:', { lat, lng })
      }
    }

    // ✅ Create hospital (Hospital model pre-save hook will convert coordinates to GeoJSON)
    const hospital = await Hospital.create({
      name: name.trim(),
      type: hospitalType,
      registrationNumber: registrationNumber?.trim() || undefined,
      description: description?.trim() || "",
      
      contactDetails: {
        phone: cleanPhone,
        email: email?.trim() || user.email,
      },
      
      address: addressData,  // ✅ Address with coordinates
      
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
      
      totalBeds: 0,
      availableBeds: 0,
      icuBeds: 0,
      emergencyBeds: 0,
      
      consultationFee: {
        general: 0,
        specialist: 0,
        emergency: 0,
      },
      emergencyFee: 0,
      
      departments: [],
      specialties: [],
      facilities: [],
      amenities: [],
      accreditations: [],
      emergencyServices: [],
      insurance: [],
      
      logo: undefined,
      images: [],
      
      createdBy: user._id,
      adminUsers: [user._id],
      
      isActive: true,
      isVerified: false,
      isProfileComplete: false,
      status: 'active',
    })

    console.log('✅ Hospital created with ID:', hospital._id)
    if (hospital.location?.coordinates) {
      console.log('✅ GeoJSON location created:', hospital.location.coordinates)
    }

    // ✅ Update HospitalAdminProfile
    existingProfile.hospitalId = hospital._id
    existingProfile.designation = existingProfile.designation || "Administrator"
    existingProfile.department = existingProfile.department || "Administration"
    await existingProfile.save()
    
    console.log('✅ HospitalAdminProfile updated')

    // ✅ Mark user profile as complete
    user.isProfileComplete = true
    await user.save()

    console.log('✅ User profile marked as complete')

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
          hasLocation: !!hospital.location?.coordinates,  // ✅ Indicate if location was set
        },
        redirect: "/hospital"
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("❌ Hospital setup error:", error)
    
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

    const user = await User.findById(userId).select('role isProfileComplete')

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.role !== "hospital_admin") {
      return NextResponse.json(
        { error: "Not authorized as hospital admin" },
        { status: 403 }
      )
    }

    const profile = await HospitalAdminProfile.findOne({ userId: user._id })
    
    if (!profile) {
      return NextResponse.json(
        {
          success: true,
          hasHospital: false,
          hospital: null,
          needsSetup: true,
        },
        { status: 200 }
      )
    }
    
    const hasHospital = !!profile.hospitalId
    let hospital = null

    if (hasHospital) {
      hospital = await Hospital.findById(profile.hospitalId)
        .select('name type address contactDetails isProfileComplete isVerified status location')
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
          hasLocation: !!hospital.location?.coordinates,  // ✅ Include location status
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
