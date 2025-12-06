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
    console.log('📦 Event data:', JSON.stringify(data, null, 2));

    // Step 1: Update Clerk metadata
    const clerkResult = await step.run('update-clerk-metadata', async () => {
      try {
        const role = data.unsafe_metadata?.role || data.public_metadata?.role || 'patient';
        
        console.log(`📝 Attempting to set role: "${role}"`);

        const clerk = await clerkClient();
        
        await clerk.users.updateUserMetadata(clerkId, {
          publicMetadata: { role },
        });

        console.log(`✅ Clerk publicMetadata.role set to "${role}"`);
        return { role, success: true };
      } catch (error) {
        console.error('❌ Clerk metadata update failed:', {
          message: error.message,
          stack: error.stack,
          clerkId
        });
        // Don't throw - continue to MongoDB step
        return { role: 'patient', success: false, error: error.message };
      }
    });

    // Step 2: Save to MongoDB
    const mongoResult = await step.run('upsert-mongo-user', async () => {
      try {
        console.log('🔌 Connecting to MongoDB...');
        await connectDB();
        console.log('✅ MongoDB connected');

        const role = clerkResult.role || 'patient';
        const email = data.email_addresses?.[0]?.email_address || '';
        const firstName = data.first_name || '';
        const lastName = data.last_name || '';
        const imageUrl = data.image_url || '';

        console.log('📝 User data to save:', {
          clerkId,
          email,
          firstName,
          lastName,
          role,
          profileImage: imageUrl
        });

        if (!email) {
          throw new Error('Email is required but not found in webhook data');
        }

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

        console.log('✅ User saved to MongoDB:', {
          mongoId: user._id.toString(),
          email: user.email,
          role: user.role
        });
        
        return { mongoId: user._id.toString(), success: true };
      } catch (error) {
        console.error('❌ MongoDB save failed:', {
          message: error.message,
          stack: error.stack,
          code: error.code,
          clerkId
        });
        
        // Return error instead of throwing to prevent function failure
        return { 
          success: false, 
          error: error.message,
          code: error.code 
        };
      }
    });

    console.log('🏁 syncUserCreation completed:', {
      clerkSuccess: clerkResult.success,
      mongoSuccess: mongoResult.success
    });

    return { 
      success: clerkResult.success && mongoResult.success,
      clerkResult,
      mongoResult
    };
  }
);

// USER UPDATED
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

        const updateData = {
          email,
          firstName,
          lastName,
          profileImage: imageUrl,
          role,
          lastLogin: new Date(),
        };

        // Use upsert: true to create if user doesn't exist (in case creation failed)
        const user = await User.findOneAndUpdate(
          { clerkId },
          {
            clerkId,
            ...updateData,
            isActive: true
          },
          { new: true, upsert: true }
        );

        console.log('✅ User updated/created:', {
          mongoId: user._id.toString(),
          email: user.email,
          role: user.role
        });
        
        return { found: true, mongoId: user._id.toString() };
      } catch (error) {
        console.error('❌ MongoDB update failed:', {
          message: error.message,
          stack: error.stack,
          clerkId
        });
        throw error;
      }
    });

    return { success: true };
  }
);

// USER DELETED
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
        console.error('❌ MongoDB deletion failed:', {
          message: error.message,
          stack: error.stack,
          clerkId
        });
        throw error;
      }
    });

    return { success: true };
  }
);
