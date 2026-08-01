import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const paddleApiKey = Deno.env.get("PADDLE_API_KEY") as string;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth header' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch the paddle_customer_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('paddle_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.paddle_customer_id) {
      return new Response(JSON.stringify({ error: 'No active subscription found for this user.' }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Call Paddle API to generate portal session
    const customerId = profile.paddle_customer_id;
    const response = await fetch(`https://sandbox-api.paddle.com/customers/${customerId}/portal-sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paddleApiKey}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Paddle API Error:', errText);
      return new Response(JSON.stringify({ error: 'Failed to generate portal link' }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const result = await response.json();
    const portalUrl = result.data?.urls?.general?.url;

    if (!portalUrl) {
       return new Response(JSON.stringify({ error: 'No portal URL returned from Paddle' }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ url: portalUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
