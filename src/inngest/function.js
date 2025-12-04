// inngest/functions.js

// ... existing setUserRole function ...

// Send appointment confirmation
export const sendAppointmentConfirmation = inngest.createFunction(
  { id: "send-appointment-confirmation" },
  { event: "appointment/booked" },
  async ({ event, step }) => {
    const { appointmentId, patientEmail, doctorName, appointmentTime } = event.data;

    // Send immediate confirmation email
    await step.run("send-confirmation-email", async () => {
      console.log(`📧 Sending confirmation to ${patientEmail}`);
      // Nodemailer logic
    });

    // Send confirmation SMS
    await step.run("send-confirmation-sms", async () => {
      console.log(`📱 Sending SMS confirmation`);
      // Authkey.io SMS logic
    });

    // Schedule reminder for 24 hours before
    const reminderTime = new Date(appointmentTime);
    reminderTime.setHours(reminderTime.getHours() - 24);

    await step.run("schedule-reminder", async () => {
      await inngest.send({
        name: "appointment/reminder.scheduled",
        data: {
          appointmentId,
          patientEmail,
          doctorName,
          appointmentTime,
          reminderTime: reminderTime.toISOString()
        }
      });
    });

    return { success: true };
  }
);

// Handle appointment cancellation
export const handleAppointmentCancellation = inngest.createFunction(
  { id: "handle-appointment-cancellation" },
  { event: "appointment/cancelled" },
  async ({ event, step }) => {
    const { appointmentId, patientEmail, doctorEmail, reason } = event.data;

    // Notify patient
    await step.run("notify-patient", async () => {
      console.log(`📧 Notifying patient about cancellation`);
      // Send email/SMS
    });

    // Notify doctor
    await step.run("notify-doctor", async () => {
      console.log(`📧 Notifying doctor about cancellation`);
      // Send email/SMS
    });

    return { success: true };
  }
);

// Daily digest for doctors
export const sendDoctorDailyDigest = inngest.createFunction(
  { id: "send-doctor-daily-digest" },
  { cron: "0 8 * * *" }, // Every day at 8 AM
  async ({ step }) => {
    await step.run("fetch-appointments", async () => {
      console.log(`📊 Fetching today's appointments for all doctors`);
      // Fetch from MongoDB
    });

    await step.run("send-digest-emails", async () => {
      console.log(`📧 Sending daily digest emails to doctors`);
      // Send emails via Nodemailer
    });

    return { success: true };
  }
);
