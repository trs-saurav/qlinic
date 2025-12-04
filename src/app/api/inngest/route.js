// src/app/api/inngest/route.js
import { serve } from 'inngest/next';
import {
  inngest,
  syncUserCreation,
  syncUserUpdate,
  syncUserDeletion
} from '@/config/inngest';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [syncUserCreation, syncUserUpdate, syncUserDeletion],
});
