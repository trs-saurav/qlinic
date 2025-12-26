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

function getRole(user) {
  return user.public_metadata?.role || user.unsafe_metadata?.role || 'patient'
}

async function upsertMongoUserFromClerkUser(clerkUser) {
  await connectDB()

  const clerkId = clerkUser.id
  const email = pickPrimaryEmail(clerkUser)
  if (!clerkId) throw new Error('Missing clerkId in Clerk payload')
  if (!email) throw new Error('Missing email in Clerk payload')

  const role = getRole(clerkUser)
  const firstName = clerkUser.first_name || ''
  const lastName = clerkUser.last_name || ''
  const imageUrl = clerkUser.image_url || clerkUser.profile_image_url || ''

  const doc = await User.findOneAndUpdate(
    { clerkId },
    {
      $set: {
        clerkId,
        email,
        firstName,
        lastName,
        role,
        profileImage: imageUrl,
        isActive: !clerkUser.banned,
        lastLogin: new Date(),
      },
      $setOnInsert: {
        isProfileComplete: false,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )

  return doc
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

    // Optional: Move role from unsafe -> public
    const role = getRole(user)

    if (!user.public_metadata?.role && user.unsafe_metadata?.role) {
      await step.run('update-clerk-metadata', async () => {
        const clerk = await clerkClient()
        await clerk.users.updateUserMetadata(clerkId, {
          publicMetadata: { role },
        })
        console.log(`✅ Moved role to publicMetadata: "${role}"`)
        return { success: true, role }
      })
    }

    const saved = await step.run('upsert-user-mongo', async () => {
      const doc = await upsertMongoUserFromClerkUser(user)
      console.log('✅ User upserted in MongoDB:', doc._id.toString())
      return { mongoId: doc._id.toString() }
    })

    return { success: true, ...saved }
  }
)

// USER UPDATED (also upsert; never skip)
export const syncUserUpdate = inngest.createFunction(
  { id: 'qlinic-sync-user-updated' },
  { event: 'webhook/request.received', if: 'event.data.type == "user.updated"' },
  async ({ event, step }) => {
    const clerkEvent = event.data
    const user = clerkEvent.data
    const clerkId = user?.id

    console.log('🔄 syncUserUpdate triggered for:', clerkId)

    const saved = await step.run('upsert-user-mongo', async () => {
      const doc = await upsertMongoUserFromClerkUser(user)
      console.log('✅ User upserted (update) in MongoDB:', doc._id.toString())
      return { mongoId: doc._id.toString() }
    })

    return { success: true, ...saved }
  }
)

// USER DELETED
export const syncUserDeletion = inngest.createFunction(
  { id: 'qlinic-sync-user-deleted' },
  { event: 'webhook/request.received', if: 'event.data.type == "user.deleted"' },
  async ({ event, step }) => {
    const clerkEvent = event.data
    const user = clerkEvent.data
    const clerkId = user?.id

    console.log('🗑️ syncUserDeletion triggered for:', clerkId)

    const result = await step.run('soft-delete-mongo-user', async () => {
      await connectDB()
      const doc = await User.findOneAndUpdate(
        { clerkId },
        { isActive: false, deletedAt: new Date() },
        { new: true }
      )

      if (!doc) return { found: false }
      console.log('✅ User soft-deleted:', doc._id.toString())
      return { found: true, mongoId: doc._id.toString() }
    })

    return { success: true, ...result }
  }
)
