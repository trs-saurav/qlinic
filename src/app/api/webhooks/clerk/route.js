// src/app/api/webhooks/clerk/route.js
import { Webhook } from 'svix';
import { clerkClient } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import connectDB from '@/config/db';
import User from '@/models/user';

export async function POST(req) {
  const payload = await req.json();
  const headersList = headers();

  const heads = {
    'svix-id': headersList.get('svix-id'),
    'svix-timestamp': headersList.get('svix-timestamp'),
    'svix-signature': headersList.get('svix-signature'),
  };

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(JSON.stringify(payload), heads);
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('ERR', { status: 400 });
  }

  if (evt.type === 'user.created') {
    await connectDB();
    const userId = evt.data.id;
    
    // Create user in DB
    await User.create({
      clerkId: userId,
      email: evt.data.email_addresses[0]?.email_address,
      firstName: evt.data.first_name,
      lastName: evt.data.last_name,
      role: 'patient'
    });
  }

  return new Response('OK');
}
