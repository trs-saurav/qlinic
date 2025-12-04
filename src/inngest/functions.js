// src/inngest/functions.js
import { inngest } from "./client";
import { clerkClient } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/user';

// Function to set user role and save to MongoDB
export const setUserRole = inngest.createFunction(
  { id: "set-user-role" },
  { event: "clerk/user.created" },
  async ({ event, step }) => {
    const { userId, email, firstName, lastName, role, imageUrl } = event.data;

    // Step 1: Update Clerk publicMetadata
    await step.run("update-clerk-metadata", async () => {
      try {
        await clerkClient.users.updateUserMetadata(userId, {
          publicMetadata: {
            role: role || 'patient'
          }
        });

        console.log(`✅ Clerk metadata updated for user ${userId}`);
        return { success: true };
      } catch (error) {
        console.error('❌ Error updating Clerk metadata:', error);
        throw error;
      }
    });

    // Step 2: Save user to MongoDB
    await step.run("save-to-mongodb", async () => {
      try {
        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({ clerkId: userId });
        
        if (existingUser) {
          console.log(`ℹ️ User ${userId} already exists in MongoDB`);
          return { exists: true };
        }

        // Create new user in MongoDB
        const newUser = await User.create({
          clerkId: userId,
          email: email,
          firstName: firstName || '',
          lastName: lastName || '',
          role: role || 'patient',
          profileImage: imageUrl || '',
          isActive: true,
          lastLogin: new Date()
        });

        console.log(`✅ User saved to MongoDB: ${newUser._id}`);
        return { 
          success: true, 
          mongoId: newUser._id.toString(),
          clerkId: userId 
        };
      } catch (error) {
        console.error('❌ Error saving to MongoDB:', error);
        throw error;
      }
    });

    // Step 3: Send welcome email (optional)
    await step.run("send-welcome-email", async () => {
      console.log(`📧 Sending welcome email to ${email}`);
      // Add your email logic here
      return { emailSent: true };
    });

    return { success: true };
  }
);

// Function to handle user updates
export const updateUser = inngest.createFunction(
  { id: "update-user" },
  { event: "clerk/user.updated" },
  async ({ event, step }) => {
    const { userId, email, firstName, lastName, imageUrl } = event.data;

    await step.run("update-mongodb-user", async () => {
      try {
        await connectDB();

        const updatedUser = await User.findOneAndUpdate(
          { clerkId: userId },
          {
            email: email,
            firstName: firstName || '',
            lastName: lastName || '',
            profileImage: imageUrl || '',
            lastLogin: new Date()
          },
          { new: true, runValidators: true }
        );

        if (updatedUser) {
          console.log(`✅ User ${userId} updated in MongoDB`);
          return { success: true, user: updatedUser };
        } else {
          console.log(`⚠️ User ${userId} not found in MongoDB`);
          return { success: false, message: 'User not found' };
        }
      } catch (error) {
        console.error('❌ Error updating user in MongoDB:', error);
        throw error;
      }
    });

    return { success: true };
  }
);

// Function to handle user deletion
export const deleteUser = inngest.createFunction(
  { id: "delete-user" },
  { event: "clerk/user.deleted" },
  async ({ event, step }) => {
    const { userId } = event.data;

    await step.run("soft-delete-mongodb-user", async () => {
      try {
        await connectDB();

        // Soft delete - just mark as inactive
        const deletedUser = await User.findOneAndUpdate(
          { clerkId: userId },
          { isActive: false },
          { new: true }
        );

        if (deletedUser) {
          console.log(`✅ User ${userId} soft deleted in MongoDB`);
          return { success: true };
        } else {
          console.log(`⚠️ User ${userId} not found in MongoDB`);
          return { success: false, message: 'User not found' };
        }
      } catch (error) {
        console.error('❌ Error deleting user in MongoDB:', error);
        throw error;
      }
    });

    return { success: true };
  }
);

// Keep your existing appointment functions
export const sendAppointmentReminder = inngest.createFunction(
  { id: "send-appointment-reminder" },
  { event: "appointment/reminder.scheduled" },
  async ({ event, step }) => {
    const { appointmentId, patientEmail, doctorName, appointmentTime } = event.data;

    await step.sleepUntil("wait-until-reminder-time", event.data.reminderTime);

    await step.run("send-sms", async () => {
      console.log(`📱 Sending SMS reminder for appointment ${appointmentId}`);
      return { smsSent: true };
    });

    await step.run("send-email", async () => {
      console.log(`📧 Sending email reminder for appointment ${appointmentId}`);
      return { emailSent: true };
    });

    return { reminderSent: true };
  }
);

export const sendAppointmentConfirmation = inngest.createFunction(
  { id: "send-appointment-confirmation" },
  { event: "appointment/booked" },
  async ({ event, step }) => {
    const { appointmentId, patientEmail, doctorName, appointmentTime } = event.data;

    await step.run("send-confirmation-email", async () => {
      console.log(`📧 Sending confirmation to ${patientEmail}`);
      return { emailSent: true };
    });

    await step.run("send-confirmation-sms", async () => {
      console.log(`📱 Sending SMS confirmation`);
      return { smsSent: true };
    });

    return { success: true };
  }
);
