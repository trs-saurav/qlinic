// src/config/inngest.js
import { Inngest } from 'inngest';
import { clerkClient } from '@clerk/nextjs/server';
import connectDB from './db';
import User from '@/models/user';

export const inngest = new Inngest({
  id: 'qlinic',
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// USER CREATED
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

    // Check if role already exists in publicMetadata (set by API)
    const existingRole = data.public_metadata?.role;
    
    if (existingRole) {
      console.log('✅ Role already in publicMetadata (set by API):', existingRole);
      
      // Just save to MongoDB
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
              role: existingRole,
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

      return { success: true, source: 'api' };
    }

    // If no publicMetadata role, check unsafeMetadata (sign-up flow)
    const role = data.unsafe_metadata?.role || 'patient';
    console.log('📝 No publicMetadata role, using unsafe/default:', role);

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

    return { success: true, source: 'signup' };
  }
);

// USER UPDATED (keep as is)
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

    await step.run('update-or-create-mongo-user', async () => {
      try {
        await connectDB();

        const email = data.email_addresses?.[0]?.email_address || '';
        const firstName = data.first_name || '';
        const lastName = data.last_name || '';
        const imageUrl = data.image_url || '';
        const role = data.public_metadata?.role || data.unsafe_metadata?.role || 'patient';

        const user = await User.findOneAndUpdate(
          { clerkId },
          {
            clerkId,
            email,
            firstName,
            lastName,
            profileImage: imageUrl,
            role,
            isActive: true,
            lastLogin: new Date(),
          },
          { new: true, upsert: true }
        );

        console.log('✅ User updated/created:', user._id.toString());
        return { found: true, mongoId: user._id.toString() };
      } catch (error) {
        console.error('❌ MongoDB update failed:', error.message);
        throw error;
      }
    });

    return { success: true };
  }
);

// USER DELETED (keep as is)
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
