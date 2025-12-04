// src/config/inngest.js
import { Inngest } from 'inngest';
import { clerkClient } from '@clerk/nextjs/server';
import connectDB from './db';
import User from '@/models/user';

// Use environment-based config
export const inngest = new Inngest({ 
  id: 'qlinic',
  // For production, you need event keys
  ...(process.env.INNGEST_EVENT_KEY && {
    eventKey: process.env.INNGEST_EVENT_KEY,
  }),
});

// Rest of your functions stay the same...
export const syncUserCreation = inngest.createFunction(
  { id: 'qlinic-sync-user-created' },
  { event: 'clerk/user.created' },
  async ({ event, step }) => {
    const data = event.data;
    const clerkId = data.id;

    console.log('🚀 syncUserCreation triggered for:', clerkId);

    await step.run('update-clerk-metadata', async () => {
      const role = data.unsafe_metadata?.role || 'patient';
      
      await clerkClient.users.updateUserMetadata(clerkId, {
        publicMetadata: { role }
      });
      
      console.log(`✅ Clerk publicMetadata.role set to "${role}"`);
      return { role };
    });

    await step.run('upsert-mongo-user', async () => {
      await connectDB();

      const role = data.unsafe_metadata?.role || 'patient';
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
          lastLogin: new Date()
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      console.log('✅ User saved to MongoDB:', user._id.toString());
      return { mongoId: user._id.toString() };
    });

    return { success: true };
  }
);

export const syncUserUpdate = inngest.createFunction(
  { id: 'qlinic-sync-user-updated' },
  { event: 'clerk/user.updated' },
  async ({ event, step }) => {
    const data = event.data;
    const clerkId = data.id;

    await step.run('update-mongo-user', async () => {
      await connectDB();

      const email = data.email_addresses?.[0]?.email_address || '';
      const firstName = data.first_name || '';
      const lastName = data.last_name || '';
      const imageUrl = data.image_url || '';

      const user = await User.findOneAndUpdate(
        { clerkId },
        {
          email,
          firstName,
          lastName,
          profileImage: imageUrl,
          lastLogin: new Date()
        },
        { new: true }
      );

      if (!user) {
        console.log(`⚠️ User ${clerkId} not found when updating`);
        return { found: false };
      }

      console.log('✅ User updated:', user._id.toString());
      return { found: true, mongoId: user._id.toString() };
    });

    return { success: true };
  }
);

export const syncUserDeletion = inngest.createFunction(
  { id: 'qlinic-sync-user-deleted' },
  { event: 'clerk/user.deleted' },
  async ({ event, step }) => {
    const clerkId = event.data.id;

    await step.run('soft-delete-mongo-user', async () => {
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
    });

    return { success: true };
  }
);
