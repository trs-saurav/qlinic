import { NextResponse } from 'next/server'
import connectDB from '@/config/db'
import Hospital from '@/models/hospital'
import { getHospitalAdmin, handleHospitalAuthError } from '@/lib/hospitalAuth'

/**
 * GET /api/hospital/profile
 * Get hospital profile for authenticated hospital admin
 */
export async function GET() {
  try {
    // ✅ Use hospitalAuth helper
    const authResult = await getHospitalAdmin()
    const error = handleHospitalAuthError(authResult, NextResponse)
    if (error) return error

    const { user, hospital } = authResult

    console.log('✅ Hospital profile fetched:', hospital.name)

    return NextResponse.json(
      {
        success: true,
        hospital: hospital,
        admin: {
          name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email,
          designation: user.hospitalAdminProfile?.designation || 'Admin',
          permissions: user.hospitalAdminProfile?.permissions || {},
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ GET hospital profile error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch hospital profile',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/hospital/profile
 * Update hospital profile with field-level permissions
 */
export async function PUT(req) {
  try {
    // ✅ Use hospitalAuth helper
    const authResult = await getHospitalAdmin()
    const error = handleHospitalAuthError(authResult, NextResponse)
    if (error) return error

    const { user, hospital, hospitalId } = authResult

    await connectDB()

    // Fetch fresh hospital document for updating
    const hospitalDoc = await Hospital.findById(hospitalId)

    if (!hospitalDoc) {
      console.log('❌ Hospital not found:', hospitalId)
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      )
    }

    const body = await req.json()

    // ✅ Check if hospital is verified or verification is pending
    const isVerified = hospitalDoc.isVerified
    const verificationPending = hospitalDoc.verificationRequest?.status === 'pending'
    const canEditBasicInfo = !isVerified && !verificationPending

    console.log('🔒 Edit permissions:', {
      isVerified,
      verificationPending,
      canEditBasicInfo,
    })

    // ✅ Fields that can ALWAYS be edited (even when verified)
    const alwaysEditableFields = [
      'totalBeds',
      'icuBeds',
      'emergencyBeds',
      'availableBeds',
      'operatingHours',
    ]

    // ✅ Fields that can ONLY be edited when NOT verified and NOT pending
    const basicInfoFields = [
      'name',
      'registrationNumber',
      'type',
      'established',
      'description',
      'contactDetails',
      'address',
      'consultationFee',
      'emergencyFee',
      'specialties',
      'facilities',
      'amenities',
      'accreditations',
      'departments',
      'emergencyServices',
      'insurance',
      'websiteUrl',
      'logo',
      'coverPhoto',
      'images',
    ]

    // Track attempted edits to locked fields
    const attemptedLockedEdits = []

    // Update always editable fields
    alwaysEditableFields.forEach((field) => {
      if (body[field] !== undefined) {
        if (field === 'operatingHours' && typeof body[field] === 'object') {
          hospitalDoc[field] = {
            ...(hospitalDoc[field]?.toObject?.() || hospitalDoc[field] || {}),
            ...body[field],
          }
        } else {
          hospitalDoc[field] = body[field]
        }
      }
    })

    // Update basic info fields only if allowed
    if (canEditBasicInfo) {
      basicInfoFields.forEach((field) => {
        if (body[field] !== undefined) {
          // ✅ Handle consultationFee specially (object type)
          if (field === 'consultationFee' && typeof body[field] === 'object') {
            hospitalDoc[field] = {
              general: body[field].general || 0,
              specialist: body[field].specialist || 0,
              emergency: body[field].emergency || 0,
            }
          } else if (
            typeof body[field] === 'object' &&
            !Array.isArray(body[field]) &&
            body[field] !== null
          ) {
            // Merge nested objects (contactDetails, address, insurance, etc.)
            hospitalDoc[field] = {
              ...(hospitalDoc[field]?.toObject?.() || hospitalDoc[field] || {}),
              ...body[field],
            }
          } else {
            hospitalDoc[field] = body[field]
          }
        }
      })

      console.log('✅ Updated basic info fields')
    } else {
      // Log attempted edits to locked fields
      basicInfoFields.forEach((field) => {
        if (body[field] !== undefined) {
          attemptedLockedEdits.push(field)
        }
      })

      if (attemptedLockedEdits.length > 0) {
        console.log(
          `⚠️ Attempted to edit locked fields: ${attemptedLockedEdits.join(', ')}`
        )
      }
    }

    // Check and update profile completion
    hospitalDoc.checkProfileCompletion()

    // Save the updated hospital
    await hospitalDoc.save()

    console.log('✅ Hospital profile updated:', hospitalDoc.name)

    return NextResponse.json(
      {
        success: true,
        message: 'Hospital profile updated successfully',
        hospital: hospitalDoc.toObject(),
        canEditBasicInfo,
        lockedFields: !canEditBasicInfo ? basicInfoFields : [],
        attemptedLockedEdits: attemptedLockedEdits.length > 0 ? attemptedLockedEdits : undefined,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ PUT hospital profile error:', error)
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }))
      
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to update hospital profile',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
