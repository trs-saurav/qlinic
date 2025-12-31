const mongoose = require('mongoose')

async function dropOldIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...')
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qlinic')
    
    const db = mongoose.connection.db
    const collection = db.collection('users')
    
    console.log('🔍 Listing all indexes...')
    const indexes = await collection.listIndexes().toArray()
    
    console.log('📋 Current indexes:', indexes.map(idx => idx.name))
    
    // Drop the problematic clerkId index if it exists
    const clerkIdIndex = indexes.find(idx => idx.name === 'clerkId_1')
    if (clerkIdIndex) {
      console.log('🗑️  Dropping old clerkId_1 index...')
      await collection.dropIndex('clerkId_1')
      console.log('✅ Dropped clerkId_1 index')
    } else {
      console.log('ℹ️  clerkId_1 index not found')
    }
    
    await mongoose.disconnect()
    console.log('✅ Done!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

dropOldIndexes()
