// src/app/api/webhooks/clerk/route.js
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { inngest } from '@/config/inngest';

export async function POST(req) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    console.error('❌ WEBHOOK_SECRET missing');
    return new Response('Config error', { status: 500 });
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing headers', { status: 400 });
  }

  let payload;
  try {
    payload = await req.json();
  } catch (e) {
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
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    return new Response('Verification failed', { status: 400 });
  }

  // ========================================
  // KEY FIX: Extract ONLY the user data
  // ========================================
  const eventType = evt.type;
  const userData = evt.data;  // ← This is the user object

  console.log('📌 Event:', eventType);
  console.log('👤 User ID:', userData.id);

  try {
    if (eventType === 'user.created') {
      // Send ONLY the user data, not the entire event
      await inngest.send({ 
        name: 'clerk/user.created', 
        data: userData  // ← Just the user object
      });
      console.log('✅ Sent user.created to Inngest');
    } 
    else if (eventType === 'user.updated') {
      await inngest.send({ 
        name: 'clerk/user.updated', 
        data: userData 
      });
      console.log('✅ Sent user.updated to Inngest');
    } 
    else if (eventType === 'user.deleted') {
      await inngest.send({ 
        name: 'clerk/user.deleted', 
        data: userData 
      });
      console.log('✅ Sent user.deleted to Inngest');
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('❌ Inngest error:', error);
    return new Response('Server error', { status: 500 });
  }
}
