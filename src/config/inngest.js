import { Inngest } from 'inngest'
import connectDB from './db'
import User from '@/models/user'

export const inngest = new Inngest({
  id: 'qlinic',
  eventKey: process.env.INNGEST_EVENT_KEY,
})

/**
 * ✅ Auth.js User Sync Strategy:
 * 
 * Since Auth.js doesn't have webhooks like Clerk, we use:
 * 1. Manual triggers from API routes (sign-in, sign-up, profile update)
 * 2. Database triggers (optional)
 * 3. Middleware-based sync (recommended)
 * 
 * Events to send:
 * - user.created: After successful registration
 * - user.updated: After profile updates
 * - user.deleted: After account deletion
 */

function getRoleFromUser(user) {
  return user.role || 'patient'
}

/**
 * BEST APPROACH (retention + no E11000):
 * - Email is canonical identity.
 * - If same email comes with new session, merge into existing Mongo user.
 * - Keep email unique in MongoDB.
 */
async function upsertMongoUserFromAuthUser(authUser) {
  await connectDB()

  const email = authUser?.email?.trim().toLowerCase()
  const sessionId = authUser?.id // Session user ID (from JWT)

  if (!email) throw new Error('Missing email in Auth.js user')

  const role = getRoleFromUser(authUser)
  const now = new Date()

  const baseUpdate = {
    email,
    firstName: authUser.name?.split(' ')[0] || '',
    lastName: authUser.name?.split(' ').slice(1).join(' ') || '',
    role,
    profileImage: authUser.image || '',
    isActive: true,
    lastLogin: now,
    lastSeenAt: now,
  }

  // 1) Try find by email (primary identifier in Auth.js)
  let doc = await User.findOne({ email })

  if (doc) {
    Object.assign(doc, baseUpdate)
    doc.firstSeenAt = doc.firstSeenAt || now
    await doc.save()
    console.log('✅ Mongo user updated:', doc._id.toString(), doc.email, doc.role)
    return doc
  }

  // 2) Create new
  const created = await User.create({
    ...baseUpdate,
    isProfileComplete: false,
    firstSeenAt: now,
  })

  console.log('✅ Mongo user created:', created._id.toString(), created.email, created.role)
  return created
}

// USER CREATED
export const syncUserCreation = inngest.createFunction(
  { id: 'qlinic-sync-user-created' },
  { event: 'user.created' },
  async ({ event, step }) => {
    const user = event.data

    console.log('🚀 syncUserCreation triggered for:', user.email)

    const saved = await step.run('save-user-mongo', async () => {
      const doc = await upsertMongoUserFromAuthUser(user)
      return { mongoId: doc._id.toString(), email: doc.email }
    })

    return { success: true, ...saved }
  }
)

// USER UPDATED
export const syncUserUpdate = inngest.createFunction(
  { id: 'qlinic-sync-user-updated' },
  { event: 'user.updated' },
  async ({ event, step }) => {
    const user = event.data

    console.log('🔄 syncUserUpdate triggered for:', user.email)

    const saved = await step.run('save-user-mongo', async () => {
      const doc = await upsertMongoUserFromAuthUser(user)
      return { mongoId: doc._id.toString(), email: doc.email }
    })

    return { success: true, ...saved }
  }
)

// USER DELETED (soft delete in Mongo)
export const syncUserDeletion = inngest.createFunction(
  { id: 'qlinic-sync-user-deleted' },
  { event: 'user.deleted' },
  async ({ event, step }) => {
    const user = event.data
    const email = user?.email?.trim().toLowerCase()
    const now = new Date()

    console.log('🗑️ syncUserDeletion triggered for:', email)

    const result = await step.run('soft-delete-mongo-user', async () => {
      await connectDB()
      const doc = await User.findOneAndUpdate(
        { email },
        { isActive: false, deletedAt: now, lastSeenAt: now },
        { new: true }
      )

      if (!doc) {
        console.log('⚠️ User not found in MongoDB:', email)
        return { found: false }
      }
      
      console.log('✅ Mongo user soft-deleted:', doc._id.toString())
      return { found: true, mongoId: doc._id.toString() }
    })

    return { success: true, ...result }
  }
)
