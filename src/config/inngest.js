// src/config/inngest.js
import { Inngest } from 'inngest';
import { clerkClient } from '@clerk/nextjs/server';
import connectDB from './db';
import User from '@/models/user';

export const inngest = new Inngest({
  id: 'qlinic',
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// USER CREATED - Keep this
export const syncUserCreation = inngest.createFunction(
  { id: 'qlinic-sync-user-created' },
  {
    event: 'webhook/request.received',
    if: 'event.data.type == "user.created"',
  },
  async ({ event, step }) => {
    const clerkEvent = event.data;
    const data = clerkEvent.data;
    const clerkId = data.id;

    console.log('🚀 syncUserCreation triggered for:', clerkId);

    // Get role from publicMetadata (set by API) or unsafeMetadata (set by sign-up)
    const role = data.public_metadata?.role || data.unsafe_metadata?.role || 'patient';
    
    console.log('📝 Detected role:', role);

    // If role is NOT in publicMetadata yet, move it there
    if (!data.public_metadata?.role && data.unsafe_metadata?.role) {
      await step.run('update-clerk-metadata', async () => {
        try {
          const clerk = await clerkClient();
          await clerk.users.updateUserMetadata(clerkId, {
            publicMetadata: { role },
          });

          console.log(`✅ Moved role to publicMetadata: "${role}"`);
          return { role, success: true };
        } catch (error) {
          console.error('❌ Clerk metadata update failed:', error.message);
          return { role, success: false, error: error.message };
        }
      });
    } else {
      console.log('✅ Role already in publicMetadata:', role);
    }

    // Save to MongoDB
    await step.run('save-to-mongo', async () => {
      try {
        await connectDB();

        const email = data.email_addresses?.[0]?.email_address || '';
        const firstName = data.first_name || '';
        const lastName = data.last_name || '';
        const imageUrl = data.image_url || '';

        const user = await User.findOneAndUpdate(
          { clerkId },
          {
            clerkId,
            email,
            firstName,
            lastName,
            role,
            profileImage: imageUrl,
            isActive: true,
            lastLogin: new Date(),
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        console.log('✅ User saved to MongoDB:', user._id.toString());
        return { mongoId: user._id.toString(), success: true };
      } catch (error) {
        console.error('❌ MongoDB save failed:', error.message);
        return { success: false, error: error.message };
      }
    });

    return { success: true };
  }
);

// USER UPDATED - Only for profile changes (not for new users)
export const syncUserUpdate = inngest.createFunction(
  { id: 'qlinic-sync-user-updated' },
  {
    event: 'webhook/request.received',
    if: 'event.data.type == "user.updated"',
  },
  async ({ event, step }) => {
    const clerkEvent = event.data;
    const data = clerkEvent.data;
    const clerkId = data.id;

    console.log('🔄 syncUserUpdate triggered for:', clerkId);

    await step.run('update-mongo-user-only', async () => {
      try {
        await connectDB();

        // Check if user exists first
        const existingUser = await User.findOne({ clerkId });

        if (!existingUser) {
          console.log('⚠️ User not found in MongoDB, skipping update (will be created by user.created)');
          return { found: false, skipped: true };
        }

        const email = data.email_addresses?.[0]?.email_address || '';
        const firstName = data.first_name || '';
        const lastName = data.last_name || '';
        const imageUrl = data.image_url || '';
        const role = data.public_metadata?.role;

        const updateData = {
          email,
          firstName,
          lastName,
          profileImage: imageUrl,
          lastLogin: new Date(),
        };

        // Only update role if it exists in metadata
        if (role) {
          updateData.role = role;
        }

        const user = await User.findOneAndUpdate(
          { clerkId },
          updateData,
          { new: true }
        );

        console.log('✅ User updated in MongoDB:', user._id.toString());
        return { found: true, mongoId: user._id.toString() };
      } catch (error) {
        console.error('❌ MongoDB update failed:', error.message);
        throw error;
      }
    });

    return { success: true };
  }
);

// USER DELETED - Keep this
export const syncUserDeletion = inngest.createFunction(
  { id: 'qlinic-sync-user-deleted' },
  {
    event: 'webhook/request.received',
    if: 'event.data.type == "user.deleted"',
  },
  async ({ event, step }) => {
    const clerkEvent = event.data;
    const data = clerkEvent.data;
    const clerkId = data.id;

    console.log('🗑️ syncUserDeletion triggered for:', clerkId);

    await step.run('soft-delete-mongo-user', async () => {
      try {
        await connectDB();

        const user = await User.findOneAndUpdate(
          { clerkId },
          { isActive: false, deletedAt: new Date() },
          { new: true }
        );

        if (!user) {
          console.log(`⚠️ User ${clerkId} not found when deleting`);
          return { found: false };
        }

        console.log('✅ User soft-deleted:', user._id.toString());
        return { found: true, mongoId: user._id.toString() };
      } catch (error) {
        console.error('❌ MongoDB deletion failed:', error.message);
        throw error;
      }
    });

    return { success: true };
  }
);
