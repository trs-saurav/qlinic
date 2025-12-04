// src/inngest/functions.js
import { inngest } from "./client";
import { clerkClient } from '@clerk/nextjs/server';

// Function to set user role in publicMetadata
export const setUserRole = inngest.createFunction(
  { id: "set-user-role" },
  { event: "clerk/user.created" },
  async ({ event, step }) => {
    const { userId, role } = event.data;

    // Update user metadata in Clerk
    await step.run("update-user-metadata", async () => {
      try {
        await clerkClient.users.updateUserMetadata(userId, {
          publicMetadata: {
            role: role || 'patient'
          }
        });

        console.log(`✅ User ${userId} role set to: ${role}`);
        return { success: true, userId, role };
      } catch (error) {
        console.error('❌ Error updating user metadata:', error);
        throw error;
      }
    });

    return { success: true };
  }
);

// Function to send appointment reminders
export const sendAppointmentReminder = inngest.createFunction(
  { id: "send-appointment-reminder" },
  { event: "appointment/reminder.scheduled" },
  async ({ event, step }) => {
    const { appointmentId, patientEmail, doctorName, appointmentTime } = event.data;

    // Wait until reminder time
    await step.sleepUntil("wait-until-reminder-time", event.data.reminderTime);

    // Send SMS reminder
    await step.run("send-sms", async () => {
      console.log(`📱 Sending SMS reminder for appointment ${appointmentId}`);
      return { smsSent: true };
    });

    // Send email reminder
    await step.run("send-email", async () => {
      console.log(`📧 Sending email reminder for appointment ${appointmentId}`);
      return { emailSent: true };
    });

    return { reminderSent: true };
  }
);

// Function to send appointment confirmation
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
