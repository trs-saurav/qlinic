// app/api/inngest/route.js
import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { setUserRole, sendAppointmentReminder } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    setUserRole,
    sendAppointmentReminder,
    // Add more functions here
  ],
});
