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

    await step.run('update-clerk-metadata', async () => {
      const role = data.unsafe_metadata?.role || 'patient';

      try {
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(clerkId, {
          publicMetadata: { role },
        });

        console.log(`✅ Clerk publicMetadata.role set to "${role}"`);
        return { role };
      } catch (error) {
        console.error('❌ Clerk metadata update failed:', error);
        throw error;
      }
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
          lastLogin: new Date(),
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );

      console.log('✅ User saved to MongoDB:', user._id.toString());
      return { mongoId: user._id.toString() };
    });

    return { success: true };
  },
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
          lastLogin: new Date(),
        },
        { new: true },
      );

      if (!user) {
        console.log(`⚠️ User ${clerkId} not found when updating`);
        return { found: false };
      }

      console.log('✅ User updated:', user._id.toString());
      return { found: true, mongoId: user._id.toString() };
    });

    return { success: true };
  },
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
    console.log('🧪 Deletion raw event:', JSON.stringify(event, null, 2));

    await step.run('soft-delete-mongo-user', async () => {
      await connectDB();

      const before = await User.findOne({ clerkId });
      console.log('🔎 Existing user before delete:', before?._id?.toString(), before);

      const user = await User.findOneAndUpdate(
        { clerkId },
        { isActive: false, deletedAt: new Date() },
        { new: true },
      );

      if (!user) {
        console.log(`⚠️ User ${clerkId} not found when deleting`);
        return { found: false };
      }

      console.log('✅ User soft-deleted:', user._id.toString());
      return { found: true, mongoId: user._id.toString() };
    });

    return { success: true };
  },
);
