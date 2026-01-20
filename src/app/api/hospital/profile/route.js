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
 * Update hospital profile with geospatial sync
 */
export async function PUT(req) {
  try {
    const authResult = await getHospitalAdmin()
    const error = handleHospitalAuthError(authResult, NextResponse)
    if (error) return error

    const { hospitalId } = authResult

    await connectDB()

    const hospitalDoc = await Hospital.findById(hospitalId)

    if (!hospitalDoc) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    const body = await req.json()

    // Permissions check
    const isVerified = hospitalDoc.isVerified
    const verificationPending = hospitalDoc.verificationRequest?.status === 'pending'
    const canEditBasicInfo = !isVerified && !verificationPending

    const alwaysEditableFields = [
      'totalBeds',
      'icuBeds',
      'emergencyBeds',
      'availableBeds',
      'operatingHours',
    ]

    const basicInfoFields = [
      'name',
      'registrationNumber',
      'type',
      'established',
      'description',
      'contactDetails',
      'address', // Contains coordinates for geospatial sync
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

    const attemptedLockedEdits = []

    // 1. Update Always Editable Fields
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

    // 2. Update Basic Info Fields (Geospatial logic inside)
    if (canEditBasicInfo) {
      basicInfoFields.forEach((field) => {
        if (body[field] !== undefined) {
          
          // Specialized handling for Address & Coordinates
          if (field === 'address' && typeof body[field] === 'object') {
            const newAddress = body[field];
            
            // Cast coordinates to Numbers to ensure the Model Hook works perfectly
            if (newAddress.coordinates) {
              if (newAddress.coordinates.latitude) 
                newAddress.coordinates.latitude = Number(newAddress.coordinates.latitude);
              if (newAddress.coordinates.longitude) 
                newAddress.coordinates.longitude = Number(newAddress.coordinates.longitude);
            }

            hospitalDoc.address = {
              ...(hospitalDoc.address?.toObject?.() || hospitalDoc.address || {}),
              ...newAddress,
            };
          } 
          // Handle consultationFee
          else if (field === 'consultationFee' && typeof body[field] === 'object') {
            hospitalDoc[field] = {
              general: body[field].general || 0,
              specialist: body[field].specialist || 0,
              emergency: body[field].emergency || 0,
            }
          } 
          // Standard Object Merge for other nested fields
          else if (
            typeof body[field] === 'object' &&
            !Array.isArray(body[field]) &&
            body[field] !== null
          ) {
            hospitalDoc[field] = {
              ...(hospitalDoc[field]?.toObject?.() || hospitalDoc[field] || {}),
              ...body[field],
            }
          } else {
            hospitalDoc[field] = body[field]
          }
        }
      })
    } else {
      basicInfoFields.forEach((field) => {
        if (body[field] !== undefined) attemptedLockedEdits.push(field)
      })
    }

    // 3. Save triggers the Hospital Model 'pre-save' hook:
    // - Converts address.coordinates -> location (GeoJSON)
    // - Converts address.city -> city_slug
    // - AUTOMATICALLY calls checkProfileCompletion() defined in your model
    await hospitalDoc.save()

    return NextResponse.json({
      success: true,
      message: 'Hospital profile updated and geospatial data synced',
      hospital: hospitalDoc.toObject(),
      canEditBasicInfo,
      attemptedLockedEdits: attemptedLockedEdits.length > 0 ? attemptedLockedEdits : undefined,
    }, { status: 200 })

  } catch (error) {
    console.error('❌ PUT hospital profile error:', error)
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({
        field: key, message: error.errors[key].message
      }))
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}