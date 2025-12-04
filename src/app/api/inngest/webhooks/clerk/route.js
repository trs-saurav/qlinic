// src/app/api/webhooks/clerk/route.js
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { inngest } from '@/inngest/client';

export async function POST(req) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add WEBHOOK_SECRET to .env');
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error: Verification failed', { status: 400 });
  }

  const eventType = evt.type;
  const { id, ...attributes } = evt.data;

  console.log(`📥 Webhook received: ${eventType}`);

  // Handle user.created event
  if (eventType === 'user.created') {
    const role = evt.data.unsafe_metadata?.role || 'patient';

    await inngest.send({
      name: "clerk/user.created",
      data: {
        userId: id,
        email: evt.data.email_addresses[0]?.email_address,
        firstName: evt.data.first_name,
        lastName: evt.data.last_name,
        imageUrl: evt.data.image_url,
        role: role,
      },
    });

    console.log(`✅ Triggered user.created for: ${id}`);
  }

  // Handle user.updated event
  if (eventType === 'user.updated') {
    await inngest.send({
      name: "clerk/user.updated",
      data: {
        userId: id,
        email: evt.data.email_addresses[0]?.email_address,
        firstName: evt.data.first_name,
        lastName: evt.data.last_name,
        imageUrl: evt.data.image_url,
      },
    });

    console.log(`✅ Triggered user.updated for: ${id}`);
  }

  // Handle user.deleted event
  if (eventType === 'user.deleted') {
    await inngest.send({
      name: "clerk/user.deleted",
      data: {
        userId: id,
      },
    });

    console.log(`✅ Triggered user.deleted for: ${id}`);
  }

  return new Response('Success', { status: 200 });
}
