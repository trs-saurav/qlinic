import mongoose from 'mongoose'
import Appointment from './src/models/appointment.js'

const MONGODB_URI = process.env.MONGODB_URI || 'your-mongodb-connection-string'

async function migrateAppointments() {
  try {
    console.log('🔌 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to database')
    
    // Check current state
    const total = await Appointment.countDocuments()
    console.log(`📊 Total appointments: ${total}`)
    
    const withReason = await Appointment.countDocuments({ reason: { $exists: true } })
    const withInstructions = await Appointment.countDocuments({ instructions: { $exists: true } })
    
    console.log(`📋 Appointments with 'reason' field: ${withReason}`)
    console.log(`📋 Appointments with 'instructions' field: ${withInstructions}`)
    
    if (withReason === total && withInstructions === total) {
      console.log('✅ All appointments already have the required fields!')
      process.exit(0)
    }
    
    // Add fields to documents that don't have them
    console.log('\n🔄 Starting migration...')
    
    const result = await mongoose.connection.db.collection('appointments').updateMany(
      {
        $or: [
          { reason: { $exists: false } },
          { instructions: { $exists: false } }
        ]
      },
      {
        $set: {
          reason: '',
          instructions: ''
        }
      }
    )
    
    console.log(`✅ Migration completed!`)
    console.log(`   - Matched: ${result.matchedCount} documents`)
    console.log(`   - Modified: ${result.modifiedCount} documents`)
    
    // Verify
    const afterReason = await Appointment.countDocuments({ reason: { $exists: true } })
    const afterInstructions = await Appointment.countDocuments({ instructions: { $exists: true } })
    
    console.log('\n📊 After migration:')
    console.log(`   - Appointments with 'reason': ${afterReason}`)
    console.log(`   - Appointments with 'instructions': ${afterInstructions}`)
    
    if (afterReason === total && afterInstructions === total) {
      console.log('\n🎉 SUCCESS! All appointments now have the required fields.')
    } else {
      console.log('\n⚠️ WARNING: Some appointments may still be missing fields.')
    }
    
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migrateAppointments()
