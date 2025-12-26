import { Inngest } from 'inngest'
import { clerkClient } from '@clerk/nextjs/server'
import connectDB from './db'
import User from '@/models/user'

export const inngest = new Inngest({
  id: 'qlinic',
  eventKey: process.env.INNGEST_EVENT_KEY,
})

function pickPrimaryEmail(user) {
  const primaryId = user.primary_email_address_id
  const emails = user.email_addresses || []
  const primary = emails.find((e) => e.id === primaryId)
  return (primary?.email_address || emails[0]?.email_address || '').trim().toLowerCase()
}

function getRole(user) {
  return user.public_metadata?.role || user.unsafe_metadata?.role || 'patient'
}

/**
 * BEST APPROACH (for retention + no E11000):
 * - Email is canonical identity.
 * - If same email arrives with a new clerkId, merge into existing Mongo user.
 * - Keep email unique in MongoDB.
 */
async function upsertMongoUserFromClerkUser(clerkUser) {
  await connectDB()

  const clerkId = clerkUser?.id
  const email = pickPrimaryEmail(clerkUser)

  if (!clerkId) throw new Error('Missing clerkId in Clerk payload')
  if (!email) throw new Error('Missing email in Clerk payload')

  const role = getRole(clerkUser)
  const now = new Date()

  const baseUpdate = {
    clerkId,
    email,
    firstName: clerkUser.first_name || '',
    lastName: clerkUser.last_name || '',
    role,
    profileImage: clerkUser.image_url || clerkUser.profile_image_url || '',
    isActive: !clerkUser.banned,
    lastLogin: now,
    lastSeenAt: now,
  }

  // 1) Find by clerkId
  let doc = await User.findOne({ clerkId })

  // 2) Merge by email if clerkId not found (prevents duplicate email insert)
  if (!doc) {
    doc = await User.findOne({ email })
  }

  if (doc) {
    // Merge: keep a single Mongo user
    Object.assign(doc, baseUpdate)
    doc.firstSeenAt = doc.firstSeenAt || now
    await doc.save()
    return doc
  }

  // Create new user
  const created = await User.create({
    ...baseUpdate,
    isProfileComplete: false,
    firstSeenAt: now,
  })

  return created
}

// USER CREATED
export const syncUserCreation = inngest.createFunction(
  { id: 'qlinic-sync-user-created' },
  { event: 'webhook/request.received', if: 'event.data.type == "user.created"' },
  async ({ event, step }) => {
    const clerkEvent = event.data
    const user = clerkEvent.data
    const clerkId = user?.id

    console.log('🚀 syncUserCreation triggered for:', clerkId)

    // Optional: move role from unsafe -> public
    const role = getRole(user)
    if (!user.public_metadata?.role && user.unsafe_metadata?.role) {
      await step.run('update-clerk-metadata', async () => {
        const clerk = await clerkClient()
        await clerk.users.updateUserMetadata(clerkId, { publicMetadata: { role } })
        return { success: true, role }
      })
    }

    const saved = await step.run('save-user-mongo', async () => {
      const doc = await upsertMongoUserFromClerkUser(user)
      console.log('✅ User saved/upserted:', doc._id.toString(), doc.email)
      return { mongoId: doc._id.toString() }
    })

    return { success: true, ...saved }
  }
)

// USER UPDATED
export const syncUserUpdate = inngest.createFunction(
  { id: 'qlinic-sync-user-updated' },
  { event: 'webhook/request.received', if: 'event.data.type == "user.updated"' },
  async ({ event, step }) => {
    const clerkEvent = event.data
    const user = clerkEvent.data
    const clerkId = user?.id

    console.log('🔄 syncUserUpdate triggered for:', clerkId)

    const saved = await step.run('save-user-mongo', async () => {
      const doc = await upsertMongoUserFromClerkUser(user)
      console.log('✅ User updated/upserted:', doc._id.toString(), doc.email)
      return { mongoId: doc._id.toString() }
    })

    return { success: true, ...saved }
  }
)

// USER DELETED (soft delete)
export const syncUserDeletion = inngest.createFunction(
  { id: 'qlinic-sync-user-deleted' },
  { event: 'webhook/request.received', if: 'event.data.type == "user.deleted"' },
  async ({ event, step }) => {
    const clerkEvent = event.data
    const user = clerkEvent.data
    const clerkId = user?.id
    const now = new Date()

    console.log('🗑️ syncUserDeletion triggered for:', clerkId)

    const result = await step.run('soft-delete-mongo-user', async () => {
      await connectDB()

      const doc = await User.findOneAndUpdate(
        { clerkId },
        { isActive: false, deletedAt: now, lastSeenAt: now },
        { new: true }
      )

      if (!doc) return { found: false }
      console.log('✅ User soft-deleted:', doc._id.toString())
      return { found: true, mongoId: doc._id.toString() }
    })

    return { success: true, ...result }
  }
)
