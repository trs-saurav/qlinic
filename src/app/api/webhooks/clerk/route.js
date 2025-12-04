// src/app/api/webhooks/clerk/route.js
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { inngest } from '@/config/inngest';

export async function POST(req) {

  
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return new Response('WEBHOOK_SECRET not configured', { status: 500 });
  }


  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');



  if (!svix_id || !svix_timestamp || !svix_signature) {

    return new Response('Missing svix headers', { status: 400 });
  }

  let payload;
  try {
    payload = await req.json();
    console.log('📦 Payload received:', JSON.stringify(payload, null, 2));
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

  } catch (err) {
  
    return new Response('Verification failed', { status: 400 });
  }

  const type = evt.type;
  console.log('📌 Event type:', type);

  try {
    if (type === 'user.created') {
      await inngest.send({ name: 'clerk/user.created', data: evt.data });
    } 
    else if (type === 'user.updated') {
      await inngest.send({ name: 'clerk/user.updated', data: evt.data });
    } 
    else if (type === 'user.deleted') {

      await inngest.send({ name: 'clerk/user.deleted', data: evt.data });

    }

    return new Response('OK', { status: 200 });
  } catch (error) {

    return new Response('Error', { status: 500 });
  }
}
