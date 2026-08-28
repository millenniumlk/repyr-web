import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const signature = req.headers.get('x-signature');
    if (!signature) {
      return new Response('Missing signature', { status: 401 });
    }

    const webhookSecret = Deno.env.get('LEMON_SQUEEZY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('LEMON_SQUEEZY_WEBHOOK_SECRET is not set');
      return new Response('Server configuration error', { status: 500 });
    }

    const rawBody = await req.text();

    // Verify HMAC-SHA256 signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify', 'sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const computedSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (computedSignature !== signature) {
      console.error('Signature mismatch');
      return new Response('Invalid signature', { status: 401 });
    }
    
    const payload = JSON.parse(rawBody);
    
    const eventName = payload.meta.event_name;
    const data = payload.data;
    const attributes = data.attributes;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (eventName === 'subscription_created' || eventName === 'subscription_updated' || eventName === 'subscription_cancelled') {
      const customData = payload.meta.custom_data || {};
      const userId = customData.userId;
      const customerId = attributes.customer_id;
      const status = attributes.status;
      const endsAt = attributes.ends_at;
      const variantId = attributes.variant_id?.toString();
      const subscriptionId = data.id;
      
      let tier = 'Trial';
      // 'cancelled' in Lemon Squeezy still grants access until ends_at
      if (status === 'active' || status === 'on_trial' || status === 'cancelled') {
        const isPlus = variantId === '2068458' || variantId === '2068450';
        tier = isPlus ? 'Plus' : 'Pro';
      }
      
      if (userId) {
        await supabase
          .from('profiles')
          .upsert({ 
            id: userId,
            subscription_tier: tier,
            ls_customer_id: customerId?.toString(),
            ls_subscription_id: subscriptionId?.toString(),
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
