import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const signatureHeader = req.headers.get('paddle-signature');
    if (!signatureHeader) {
      return new Response('Missing signature', { status: 401 });
    }

    const webhookSecret = Deno.env.get('PADDLE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('PADDLE_WEBHOOK_SECRET is not set');
      return new Response('Server configuration error', { status: 500 });
    }

    const rawBody = await req.text();

    // Parse Paddle Signature Header (format: ts=123;h1=abc)
    const parts = signatureHeader.split(';');
    let ts = '';
    let h1 = '';
    for (const part of parts) {
      if (part.startsWith('ts=')) ts = part.substring(3);
      if (part.startsWith('h1=')) h1 = part.substring(3);
    }

    if (!ts || !h1) {
      return new Response('Invalid signature format', { status: 401 });
    }

    // Replay attack protection (MED-2)
    // Check if the timestamp is within the last 5 minutes (300 seconds)
    const currentTs = Math.floor(Date.now() / 1000);
    const signatureTs = parseInt(ts, 10);
    if (Math.abs(currentTs - signatureTs) > 300) {
      console.error('Webhook timestamp out of acceptable window (replay attack protection)');
      return new Response('Timestamp invalid', { status: 401 });
    }

    // Verify HMAC-SHA256 signature
    const signedPayload = `${ts}:${rawBody}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify', 'sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const computedSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (computedSignature !== h1) {
      console.error('Signature mismatch');
      return new Response('Invalid signature', { status: 401 });
    }
    
    const payload = JSON.parse(rawBody);
    
    const eventType = payload.event_type;
    const data = payload.data;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (eventType === 'subscription.created' || eventType === 'subscription.updated' || eventType === 'subscription.canceled') {
      const customData = data.custom_data || {};
      const userId = customData.userId;
      const customerId = data.customer_id;
      const status = data.status;
      const endsAt = data.current_billing_period?.ends_at;
      
      const items = data.items || [];
      const firstItemPriceId = items.length > 0 ? items[0].price?.id : '';
      
      let tier = 'Trial';
      if (status === 'active' || status === 'trialing' || status === 'canceled' || status === 'past_due') {
        const isPlus = firstItemPriceId === 'pri_01kyy15yhbjgftzkcsjyjmm9pm' || firstItemPriceId === 'pri_01kyy16sh5qt3wyybn04r1ypkr';
        const intendedTier = isPlus ? 'Plus' : 'Pro';
        
        if (status === 'canceled' || status === 'past_due') {
            if (endsAt && new Date(endsAt).getTime() > Date.now()) {
                tier = intendedTier;
            } else {
                tier = 'Trial';
            }
        } else {
            tier = intendedTier;
        }
      }
      
      // If a user cancels, their status usually becomes 'canceled' or remains 'active' until the end of the billing period
      // We rely on the status and expiration date.
      
      if (userId) {
        await supabase
          .from('profiles')
          .upsert({ 
            id: userId,
            subscription_tier: tier,
            paddle_customer_id: customerId,
            subscription_expires_at: endsAt || null
          });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
