// app/api/webhooks/clerk/route.js
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { clerkClient } from '@clerk/nextjs/server'

export async function POST(req) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add WEBHOOK_SECRET to .env')
  }

  // Get the headers
  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)

  let evt

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error: Verification failed', { status: 400 })
  }

  const { id } = evt.data
  const eventType = evt.type

  // Handle user.created event to set publicMetadata
  if (eventType === 'user.created') {
    try {
      const role = evt.data.unsafe_metadata?.role || 'patient' // Default to patient
      
      await clerkClient.users.updateUserMetadata(id, {
        publicMetadata: {
          role: role
        }
      })

      console.log(`User ${id} created with role: ${role}`)
    } catch (error) {
      console.error('Error updating user metadata:', error)
      return new Response('Error updating metadata', { status: 500 })
    }
  }

  return new Response('Success', { status: 200 })
}
