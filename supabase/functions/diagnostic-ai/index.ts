import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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

    const { sessionId, chatContext, newMessage } = await req.json();

    if (!sessionId) {
      throw new Error("Missing sessionId");
    }

    // Verify session belongs to user and get current state
    const { data: session, error: sessionError } = await supabaseClient
      .from('diagnostic_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      throw new Error("Session not found or access denied");
    }

    // Check limits
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const rawTier = profile?.subscription_tier ? String(profile.subscription_tier).trim() : 'Trial';
    const tier = rawTier.charAt(0).toUpperCase() + rawTier.slice(1).toLowerCase();

    if (tier !== 'Pro') {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { count, error: countError } = await supabaseClient
        .from('diagnostic_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', twentyFourHoursAgo)
        .lte('created_at', session.created_at);

      if (!countError && count !== null) {
        const maxSessions = tier === 'Plus' ? 5 : 1;
        if (count > maxSessions) {
          return new Response(JSON.stringify({ error: 'Daily limit reached.' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // Manage Chat History Securely
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

    // Important: Update DB securely via Edge Function so client cannot modify it directly
    // Using service role key if available because the user may not have update permissions if we lockdown RLS, 
    // but using the user JWT is fine if RLS allows it (it currently allows it based on existing code).
    await supabaseClient
      .from('diagnostic_sessions')
      .update({
        chat_history: finalChatContext,
        status: aiResponse.status,
        final_probabilities: aiResponse.current_probabilities || null,
      })
      .eq('id', sessionId);

    return new Response(JSON.stringify(aiResponse), {
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
