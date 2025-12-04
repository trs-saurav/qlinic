// src/app/api/inngest/route.js
import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { 
  setUserRole,
  updateUser,
  deleteUser,
  sendAppointmentReminder,
  sendAppointmentConfirmation 
} from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    setUserRole,
    updateUser,
    deleteUser,
    sendAppointmentReminder,
    sendAppointmentConfirmation,
  ],
});
