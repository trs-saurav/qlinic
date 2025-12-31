import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {

    const opts = {
      bufferCommands: false,
    };
    cached.promise = mongoose.connect(`${process.env.MONGODB_URI}/qlinic`, opts).then(async (mongoose) => {
      // Drop problematic old indexes on first connect
      try {
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        const indexes = await usersCollection.listIndexes().toArray();
        const badIndexes = indexes.filter(idx => !idx.sparse && idx.unique && Object.keys(idx.key).includes('clerkId'));
        
        for (const badIndex of badIndexes) {
          console.log(`🗑️  Dropping problematic index: ${badIndex.name}`);
          await usersCollection.dropIndex(badIndex.name);
        }
      } catch (error) {
        // Index might not exist yet, that's fine
        if (!error.message.includes('ns does not exist')) {
          console.log('ℹ️  No old indexes to clean up');
        }
      }
      return mongoose;

    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;