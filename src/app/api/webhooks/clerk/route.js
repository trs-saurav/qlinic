// src/app/api/webhooks/clerk/route.js
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { inngest } from '@/config/inngest';

export async function POST(req) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error('❌ WEBHOOK_SECRET missing');
    return new Response('WEBHOOK_SECRET not configured', { status: 500 });
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('❌ Missing svix headers');
    return new Response('Missing svix headers', { status: 400 });
  }

  let payload;
  try {
    payload = await req.json();
    console.log('📦 Raw payload:', JSON.stringify(payload, null, 2));
  } catch (e) {
    console.error('❌ Failed to parse JSON:', e);
    return new Response('Invalid JSON', { status: 400 });
  }

  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
    console.log('✅ Webhook signature verified');
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    return new Response('Verification failed', { status: 400 });
  }

  const eventType = evt.type;
  console.log('📌 Event type:', eventType);

  try {
    // Send ONLY the Clerk data, not the entire event wrapper
    if (eventType === 'user.created') {
      console.log('👤 Sending user.created to Inngest');
      await inngest.send({ 
        name: 'clerk/user.created', 
        data: evt.data  // ← Just evt.data, not the whole evt
      });
      console.log('✅ Sent to Inngest');
    } 
    else if (eventType === 'user.updated') {
      console.log('🔄 Sending user.updated to Inngest');
      await inngest.send({ 
        name: 'clerk/user.updated', 
        data: evt.data 
      });
      console.log('✅ Sent to Inngest');
    } 
    else if (eventType === 'user.deleted') {
      console.log('🗑️ Sending user.deleted to Inngest');
      await inngest.send({ 
        name: 'clerk/user.deleted', 
        data: evt.data 
      });
      console.log('✅ Sent to Inngest');
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('❌ Error sending to Inngest:', error);
    return new Response('Error', { status: 500 });
  }
}
