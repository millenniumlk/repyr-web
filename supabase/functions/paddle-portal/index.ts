import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://repyrai.com';

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const isAllowed = origin === ALLOWED_ORIGIN || origin.startsWith('http://localhost');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const paddleApiKey = Deno.env.get("PADDLE_API_KEY") as string;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get paddle_customer_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('paddle_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile?.paddle_customer_id) {
      return new Response(JSON.stringify({ error: 'No active customer found' }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Call Paddle API to create a Customer Portal Session
    const paddleResponse = await fetch(`https://sandbox-api.paddle.com/customers/${profile.paddle_customer_id}/portal-sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paddleApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (!paddleResponse.ok) {
      const errorText = await paddleResponse.text();
      console.error("Paddle API Error:", errorText);
      return new Response(JSON.stringify({ error: 'Failed to generate portal session from Paddle' }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const paddleData = await paddleResponse.json();
    const portalUrl = paddleData.data?.urls?.general?.overview;

    if (!portalUrl) {
      return new Response(JSON.stringify({ error: 'No portal URL returned by Paddle' }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
