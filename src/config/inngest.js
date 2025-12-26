// src/config/inngest.js
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

function getRoleFromEvent(user) {
  return user.public_metadata?.role || user.unsafe_metadata?.role || 'patient'
}

/**
 * Ensures publicMetadata.role is set in Clerk and verifies it by refetching the user.
 * This makes role robust after delete + re-register cases.
 */
async function ensurePublicRole({ clerkId, role, step }) {
  return await step.run('ensure-public-role', async () => {
    const clerk = await clerkClient()

    // Write
    await clerk.users.updateUserMetadata(clerkId, {
      publicMetadata: { role },
    })

    // Read-back verify (helps if you suspect it isn't sticking)
    const refreshed = await clerk.users.getUser(clerkId)
    const savedRole = refreshed.publicMetadata?.role

    console.log('✅ ensurePublicRole:', { clerkId, requestedRole: role, savedRole })

    return { requestedRole: role, savedRole }
  })
}

/**
 * BEST APPROACH (retention + no E11000):
 * - Email is canonical identity.
 * - If same email comes with new clerkId, merge into existing Mongo user.
 * - Keep email unique in MongoDB.
 */
async function upsertMongoUserFromClerkUser(clerkUser) {
  await connectDB()

  const clerkId = clerkUser?.id
  const email = pickPrimaryEmail(clerkUser)

  if (!clerkId) throw new Error('Missing clerkId in Clerk payload')
  if (!email) throw new Error('Missing email in Clerk payload')

  const role = getRoleFromEvent(clerkUser)
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

  // 1) Try find by clerkId
  let doc = await User.findOne({ clerkId })

  // 2) If not found, merge by email (prevents duplicate email insert)
  if (!doc) doc = await User.findOne({ email })

  if (doc) {
    Object.assign(doc, baseUpdate)
    doc.firstSeenAt = doc.firstSeenAt || now
    await doc.save()
    return doc
  }

  // 3) Create new
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

    // ✅ Always ensure role is set in publicMetadata (even after re-register)
    const roleFromEvent = getRoleFromEvent(user)
    if (user.public_metadata?.role !== roleFromEvent) {
      await ensurePublicRole({ clerkId, role: roleFromEvent, step })
    }

    const saved = await step.run('save-user-mongo', async () => {
      const doc = await upsertMongoUserFromClerkUser(user)
      console.log('✅ Mongo user upserted (created):', doc._id.toString(), doc.email, doc.role)
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

    // ✅ Ensure role in publicMetadata if missing or mismatched
    const roleFromEvent = getRoleFromEvent(user)
    if (user.public_metadata?.role !== roleFromEvent) {
      await ensurePublicRole({ clerkId, role: roleFromEvent, step })
    }

    const saved = await step.run('save-user-mongo', async () => {
      const doc = await upsertMongoUserFromClerkUser(user)
      console.log('✅ Mongo user upserted (updated):', doc._id.toString(), doc.email, doc.role)
      return { mongoId: doc._id.toString() }
    })

    return { success: true, ...saved }
  }
)

// USER DELETED (soft delete in Mongo)
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
      console.log('✅ Mongo user soft-deleted:', doc._id.toString())
      return { found: true, mongoId: doc._id.toString() }
    })

    return { success: true, ...result }
  }
)
