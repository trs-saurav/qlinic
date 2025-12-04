// src/config/inngest.js
import { Inngest } from 'inngest';
import { clerkClient } from '@clerk/nextjs/server';
import connectDB from './db';
import User from '@/models/user';

export const inngest = new Inngest({ id: 'qlinic' });

/**
 * clerk/user.created → set role in Clerk + create user in Mongo
 */
export const syncUserCreation = inngest.createFunction(
  { id: 'qlinic-sync-user-created' },
  { event: 'clerk/user.created' },
  async ({ event, step }) => {
    const data = event.data;
    const clerkId = data.id;

    // 1) Update Clerk publicMetadata.role
    await step.run('update-clerk-metadata', async () => {
      const role = data.unsafe_metadata?.role || 'patient';
      await clerkClient.users.updateUserMetadata(clerkId, {
        publicMetadata: { role }
      });
      console.log(`✅ Clerk publicMetadata.role set to "${role}" for ${clerkId}`);
      return { role };
    });

    // 2) Upsert user in MongoDB
    await step.run('upsert-mongo-user', async () => {
      await connectDB();

      const role = data.unsafe_metadata?.role || 'patient';
      const email = data.email_addresses?.[0]?.email_address || '';
      const firstName = data.first_name || '';
      const lastName = data.last_name || '';
      const imageUrl = data.image_url || '';

      const update = {
        clerkId,
        email,
        firstName,
        lastName,
        role,
        profileImage: imageUrl,
        isActive: true,
        lastLogin: new Date()
      };

      const user = await User.findOneAndUpdate(
        { clerkId },
        update,
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      console.log('✅ User synced to MongoDB:', user._id.toString());
      return { mongoId: user._id.toString() };
    });

    return { success: true };
  }
);

/**
 * clerk/user.updated → keep Mongo in sync
 */
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
        console.log(`⚠️ User with clerkId=${clerkId} not found when updating`);
        return { found: false };
      }

      console.log('✅ User updated in MongoDB:', user._id.toString());
      return { found: true, mongoId: user._id.toString() };
    });

    return { success: true };
  }
);

/**
 * clerk/user.deleted → soft delete in Mongo
 */
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
        console.log(`⚠️ User with clerkId=${clerkId} not found when deleting`);
        return { found: false };
      }

      console.log('✅ User soft-deleted in MongoDB:', user._id.toString());
      return { found: true, mongoId: user._id.toString() };
    });

    return { success: true };
  }
);
