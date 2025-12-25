// scripts/addLocations.js
// Run this script to add sample locations to existing doctors and hospitals

import mongoose from 'mongoose'
import User from '../src/models/user.js'
import Hospital from '../src/models/hospital.js'

const MONGODB_URI = process.env.MONGODB_URI

// Sample locations (Major Indian cities)
const cityLocations = {
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Delhi': { lat: 28.7041, lng: 77.1025 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 }
}

async function addLocationsToExistingData() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Update Doctors
    const doctors = await User.find({ role: 'doctor' })
    console.log(`Found ${doctors.length} doctors`)

    for (const doctor of doctors) {
      const cities = Object.keys(cityLocations)
      const randomCity = cities[Math.floor(Math.random() * cities.length)]
      const location = cityLocations[randomCity]
      
      // Add some random offset (±0.05 degrees ~ 5km)
      const lat = location.lat + (Math.random() - 0.5) * 0.1
      const lng = location.lng + (Math.random() - 0.5) * 0.1

      doctor.doctorProfile = doctor.doctorProfile || {}
      doctor.doctorProfile.location = {
        type: 'Point',
        coordinates: [lng, lat],
        city: randomCity,
        state: getState(randomCity),
        country: 'India'
      }

      await doctor.save()
      console.log(`✅ Updated location for Dr. ${doctor.firstName} ${doctor.lastName} - ${randomCity}`)
    }

    // Update Hospitals
    const hospitals = await Hospital.find()
    console.log(`Found ${hospitals.length} hospitals`)

    for (const hospital of hospitals) {
      const city = hospital.address?.city || Object.keys(cityLocations)[0]
      const location = cityLocations[city] || cityLocations['Mumbai']
      
      // Add some random offset
      const lat = location.lat + (Math.random() - 0.5) * 0.1
      const lng = location.lng + (Math.random() - 0.5) * 0.1

      hospital.location = {
        type: 'Point',
        coordinates: [lng, lat]
      }

      await hospital.save()
      console.log(`✅ Updated location for ${hospital.name} - ${city}`)
    }

    console.log('✅ All locations updated successfully')
    process.exit(0)

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

function getState(city) {
  const stateMap = {
    'Mumbai': 'Maharashtra',
    'Pune': 'Maharashtra',
    'Delhi': 'Delhi',
    'Bangalore': 'Karnataka',
    'Chennai': 'Tamil Nadu',
    'Kolkata': 'West Bengal',
    'Hyderabad': 'Telangana',
    'Ahmedabad': 'Gujarat'
  }
  return stateMap[city] || 'India'
}

addLocationsToExistingData()
