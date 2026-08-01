import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

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
    
    // In a real environment, verify the webhook signature here using the paddle-node-sdk
    // For now we parse it directly
    const payload = JSON.parse(bodyText);
    
    const eventType = payload.event_type;
    const data = payload.data;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (eventType === 'subscription.created' || eventType === 'subscription.updated') {
      const customData = data.custom_data || {};
      const userId = customData.userId;
      
      const priceId = data.items?.[0]?.price?.id;
      // Pro prices from frontend
      const isProUser = priceId === 'pri_01kyy11tk9bzmpe7jaj4sq74e2' || priceId === 'pri_01kyy14epj1ndxbe4gbwchfn37';
      
      const endsAt = data.current_billing_period?.ends_at || null;
      
      if (userId) {
        await supabase
          .from('profiles')
          .update({ 
            is_pro: isProUser,
            subscription_expires_at: endsAt
          })
          .eq('id', userId);
      }
    } else if (eventType === 'subscription.canceled') {
      const customData = data.custom_data || {};
      const userId = customData.userId;
      
      if (userId) {
        await supabase
          .from('profiles')
          .update({ 
            is_pro: false,
            subscription_expires_at: null
          }) // Downgrade
          .eq('id', userId);
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
