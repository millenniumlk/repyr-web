import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://repyrai.com';

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  // Allow the configured production origin, or localhost for development
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized user");
    }

    const { sessionId, chatContext, newMessage, vehicleData } = await req.json();

    // ── Resolve subscription tier (used by both flows) ──
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const rawTier = profile?.subscription_tier ? String(profile.subscription_tier).trim() : 'Trial';
    const tier = rawTier.charAt(0).toUpperCase() + rawTier.slice(1).toLowerCase();

    let session: any;
    let activeSessionId = sessionId;

    if (!sessionId && vehicleData) {
      // ═══════════════════════════════════════════════════
      // NEW SESSION FLOW — create session server-side
      // ═══════════════════════════════════════════════════

      // 1. Check limits BEFORE creating the session
      if (tier !== 'Pro') {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { count, error: countError } = await supabaseClient
          .from('diagnostic_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', twentyFourHoursAgo);

        if (!countError && count !== null) {
          let adjustedCount = count;

          if (tier === 'Plus') {
            const { data: firstSession } = await supabaseClient
              .from('diagnostic_sessions')
              .select('created_at')
              .eq('user_id', user.id)
              .order('created_at', { ascending: true })
              .limit(1)
              .single();

            if (firstSession && new Date(firstSession.created_at) >= new Date(twentyFourHoursAgo)) {
              adjustedCount = Math.max(0, adjustedCount - 1);
            }
          }

          const maxSessions = tier === 'Plus' ? 5 : 1;
          if (adjustedCount >= maxSessions) {
            return new Response(JSON.stringify({ error: 'Daily limit reached.' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }
      }

      // 2. Create the session server-side
      const vehicleId = vehicleData.id && vehicleData.id !== 'guest-vehicle' && vehicleData.id !== 'pending-vehicle'
        ? vehicleData.id
        : null;

      const { data: newSession, error: insertError } = await supabaseClient
        .from('diagnostic_sessions')
        .insert([{
          vehicle_id: vehicleId,
          user_id: user.id,
          vehicle_make: vehicleData.make,
          vehicle_model: vehicleData.model,
          vehicle_year: vehicleData.year,
          vehicle_mileage: vehicleData.mileage,
          vehicle_engine: vehicleData.fuel_type,
          location: vehicleData.location,
          initial_category: vehicleData.category || 'General',
          user_description: vehicleData.description,
        }])
        .select()
        .single();

      if (insertError || !newSession) {
        throw new Error("Failed to create session: " + (insertError?.message || 'Unknown error'));
      }

      session = newSession;
      activeSessionId = newSession.id;

    } else if (sessionId) {
      // ═══════════════════════════════════════════════════
      // EXISTING SESSION FLOW — follow-up messages
      // ═══════════════════════════════════════════════════

      const { data: existingSession, error: sessionError } = await supabaseClient
        .from('diagnostic_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (sessionError || !existingSession) {
        throw new Error("Session not found or access denied");
      }

      session = existingSession;
    } else {
      throw new Error("Must provide either sessionId or vehicleData");
    }

    // ── Build chat context ──
    let finalChatContext = [];
    if (!session.chat_history || session.chat_history.length === 0) {
      if (!chatContext || !Array.isArray(chatContext)) {
        throw new Error("Initial chatContext is missing");
      }
      finalChatContext = chatContext;
    } else {
      if (!newMessage) {
        throw new Error("newMessage is missing");
      }
      finalChatContext = [...session.chat_history, { role: 'user', content: newMessage }];
    }

    // ── Call OpenAI ──
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiApiKey) {
      throw new Error("Missing OPENAI_API_KEY environment variable");
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: finalChatContext,
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API Error response:", errorText);
      return new Response(JSON.stringify({ error: 'Failed to communicate with OpenAI' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const data = await response.json();
    const contentString = data.choices[0].message.content;
    const aiResponse = JSON.parse(contentString);
    
    finalChatContext.push({ role: 'assistant', content: JSON.stringify(aiResponse) });

    // ── Update session in DB ──
    await supabaseClient
      .from('diagnostic_sessions')
      .update({
        chat_history: finalChatContext,
        status: aiResponse.status,
        final_probabilities: aiResponse.current_probabilities || null,
      })
      .eq('id', activeSessionId);

    // Include sessionId in the response so the client can use it for follow-up messages
    return new Response(JSON.stringify({ ...aiResponse, sessionId: activeSessionId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

