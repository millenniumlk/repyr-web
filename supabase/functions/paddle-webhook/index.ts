import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Environment, Paddle } from "npm:@paddle/paddle-node-sdk@^1.4.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

// Pull credentials from Supabase Edge Function Secrets / .env
const PADDLE_API_KEY = Deno.env.get("PADDLE_API_KEY") || '';
const PADDLE_WEBHOOK_SECRET = Deno.env.get("PADDLE_WEBHOOK_SECRET") || '';

const paddle = new Paddle(PADDLE_API_KEY, {
  environment: Environment.sandbox, 
});

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const signature = req.headers.get('paddle-signature');
    if (!signature) {
      return new Response('Missing signature', { status: 401 });
    }

    const bodyText = await req.text();
    
    // Verify signature and unmarshal using Paddle Node SDK
    let eventData;
    try {
      eventData = paddle.webhooks.unmarshal(bodyText, PADDLE_WEBHOOK_SECRET, signature);
    } catch (e) {
      console.error("Signature verification failed:", e);
      return new Response('Invalid signature', { status: 401 });
    }
    
    const eventType = eventData.eventType;
    const data = eventData.data as any; // Cast for now
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (eventType === 'subscription.created' || eventType === 'subscription.updated') {
      const customData = data.customData || {};
      const userId = customData.userId;
      
      let tier = 'Plus';
      // Find the item price ID to determine the tier
      if (data.items && data.items.length > 0) {
        const priceId = data.items[0].price.id;
        // Check if price matches 'Repyr Pro' (monthly or yearly)
        if (priceId === 'pri_01kyy11tk9bzmpe7jaj4sq74e2' || priceId === 'pri_01kyy14epj1ndxbe4gbwchfn37') {
          tier = 'Pro';
        }
      }
      
      if (userId) {
        await supabase
          .from('profiles')
          .update({ subscription_tier: tier })
          .eq('id', userId);
      }
    } else if (eventType === 'subscription.canceled') {
      const customData = data.customData || {};
      const userId = customData.userId;
      
      if (userId) {
        await supabase
          .from('profiles')
          .update({ subscription_tier: 'Trial' }) // Downgrade
          .eq('id', userId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
