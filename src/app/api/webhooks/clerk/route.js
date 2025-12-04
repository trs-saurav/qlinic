// src/app/api/webhooks/clerk/route.js
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { inngest } from '@/inngest/client';

export async function POST(req) {
  console.log('📥 Clerk webhook received');
  
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('❌ WEBHOOK_SECRET missing');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('❌ Missing Svix headers');
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
    console.error('❌ Webhook verification failed:', err);
    return new Response('Verification failed', { status: 400 });
  }

  const eventType = evt.type;
  console.log(`📦 Event type: ${eventType}`);

  // Handle user.created
  if (eventType === 'user.created') {
    const role = evt.data.unsafe_metadata?.role || 'patient';
    
    console.log('👤 New user created:', {
      id: evt.data.id,
      email: evt.data.email_addresses[0]?.email_address,
      role: role
    });

    try {
      await inngest.send({
        name: "clerk/user.created",
        data: {
          userId: evt.data.id,
          email: evt.data.email_addresses[0]?.email_address,
          firstName: evt.data.first_name || '',
          lastName: evt.data.last_name || '',
          imageUrl: evt.data.image_url || '',
          role: role,
        },
      });

      console.log('✅ Inngest event sent successfully');
    } catch (error) {
      console.error('❌ Failed to send Inngest event:', error);
      return new Response('Failed to process webhook', { status: 500 });
    }
  }

  return new Response('Webhook processed', { status: 200 });
}
