import { inngest } from '@/config/inngest'

/**
 * Trigger user.created event after registration
 */
export async function triggerUserCreated(user) {
  try {
    await inngest.send({
      name: 'user.created',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role || 'patient',
      },
    })
    console.log('✅ Triggered user.created for:', user.email)
  } catch (error) {
    console.error('❌ Failed to trigger user.created:', error)
  }
}

/**
 * Trigger user.updated event after profile update
 */
export async function triggerUserUpdated(user) {
  try {
    await inngest.send({
      name: 'user.updated',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role || 'patient',
      },
    })
    console.log('✅ Triggered user.updated for:', user.email)
  } catch (error) {
    console.error('❌ Failed to trigger user.updated:', error)
  }
}

/**
 * Trigger user.deleted event after account deletion
 */
export async function triggerUserDeleted(user) {
  try {
    await inngest.send({
      name: 'user.deleted',
      data: {
        id: user.id,
        email: user.email,
      },
    })
    console.log('✅ Triggered user.deleted for:', user.email)
  } catch (error) {
    console.error('❌ Failed to trigger user.deleted:', error)
  }
}
