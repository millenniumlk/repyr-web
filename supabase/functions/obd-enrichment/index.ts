import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code, make, title } = await req.json();

    if (!code) {
      throw new Error("Missing 'code' parameter");
    }

    const safeCode = String(code).toUpperCase().trim();
    const safeMake = make ? String(make).trim() : 'Generic';
    const isUnknown = !title || title.trim() === '' || title === 'Unknown Code';
    const safeTitle = isUnknown ? 'Unknown Code' : title;
    
    // Use gpt-4o for unknown codes to prevent hallucination, gpt-4o-mini for known codes to save cost
    const aiModel = isUnknown ? 'gpt-4o' : 'gpt-4o-mini';

    // 1. Initialize Supabase client
    // For inserting in the Edge Function, we use the Service Role key since RLS might block anon
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Fetch from OpenAI
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiApiKey) {
      throw new Error("Missing OPENAI_API_KEY environment variable");
    }

    const systemPrompt = `You are an expert, veteran ASE Certified Master Technician writing an engaging, human-sounding automotive blog post for everyday drivers.
You are writing a comprehensive, highly accurate guide for the OBD-II code ${safeCode} (${safeTitle}).
${isUnknown ? `CRITICAL INSTRUCTION: You were not provided a title for this code. You MUST accurately look up the official SAE definition for ${safeCode}. Do not hallucinate or confuse hex codes (like P000A) with numerical codes (like P0002).` : ''}
${safeMake !== 'Generic' ? `The specific vehicle make is: ${safeMake}. Provide make-specific context, known technical service bulletins (TSBs), or common failures for this make.` : 'Provide a general overview.'}

CRITICAL TONE RESTRICTIONS & FORMATTING:
- Write in a highly informative, professional, and technically precise tone.
- Do not use overly casual or conversational language. Instead, sound like an authoritative automotive engineering manual or a highly technical master technician's report.
- Focus on detailed mechanical and electrical explanations. Explain the engineering principles behind why the component fails.
- Do not use colloquialisms, slang, or overly simple analogies. Treat the reader as someone seeking deep technical knowledge.
- Keep paragraphs structured, informative, and detailed.
- BANNED WORDS: You are strictly forbidden from using: "Furthermore", "Additionally", "Crucially", "Delve", "Navigating", "Complexities", "In conclusion", "It is important to note", or "Ultimately".
- Use Markdown formatting for the 'description' field. Do NOT start the description with a heading. The first paragraph must dive directly into the technical overview. Afterward, you MUST use exactly these two distinct subheadings (using ###) to break up the remaining text: "### How to diagnose the ${safeCode} code" and "### What are the possible causes of the ${safeCode} code". Use **bolding** for emphasis.

SEO REQUIREMENT:
You must naturally weave the following exact-match keywords into the 'description' article body. Do not make them sound forced:
1. "how to fix ${safeCode}"
2. "what does ${safeCode} mean"
3. "${safeMake !== 'Generic' ? safeMake + ' ' : ''}${safeCode} symptoms"
4. "${safeCode} repair cost"

SEO REQUIREMENT FOR FAQs (FEATURED SNIPPETS):
You must generate 5 highly specific, long-tail FAQs. 
To win Google Featured Snippets, every FAQ answer MUST follow these strict rules:
1. Start the answer directly with the exact answer, or a "Yes" or "No", before elaborating.
2. Keep every answer between 40 to 60 words (Google's exact preferred length).
3. Use questions people actually type into Google (e.g., "Can a bad battery cause a ${safeCode}?", "How much does it cost to fix ${safeCode}?").

You must respond in strict JSON matching this schema:
{
  "title": "The official technical definition of the code. Keep it concise.",
  "quick_answer": "A 1-2 sentence precise, technical summary of the component failure.",
  "severity": "Low, Moderate, High, or Severe",
  "drivability": "A 1-2 sentence technical assessment of drivability impacts and potential secondary damage if driven.",
  "description": "The main article body formatted in Markdown. Use 3-4 distinct subheadings (###) to break up the text. Write in a highly technical and professional tone. Minimum 400 words.",
  "symptoms": ["List 4 to 6 technical symptoms (e.g. 'Open loop fuel fault', 'Reduced manifold vacuum'). Symptom 1...", "Symptom 2..."],
  "causes": ["List 4 to 6 root mechanical/electrical causes. Cause 1...", "Cause 2...", "Cause 3..."],
  "fixes": ["List 3 to 5 step-by-step diagnostic and repair procedures. Fix 1...", "Fix 2...", "Fix 3..."],
  "estimated_cost": "Estimated repair cost (e.g., '$100 - $350'). Be realistic for US currency.",
  "faqs": [ 
    {"question": "Must be a long-tail question users type into Google (e.g. 'Can a bad battery cause a [CODE]?')", "answer": "Must start with a direct Yes/No or clear answer. Must be exactly 40 to 60 words for Google Featured Snippet optimization."},
    {"question": "FAQ 2", "answer": "Answer 2"},
    {"question": "FAQ 3", "answer": "Answer 3"},
    {"question": "FAQ 4", "answer": "Answer 4"},
    {"question": "FAQ 5", "answer": "Answer 5"}
  ]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [{ role: 'system', content: systemPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI Error:", errText);
      throw new Error(`OpenAI Error: ${errText}`);
    }

    const data = await response.json();
    const contentString = data.choices[0].message.content;
    const aiData = JSON.parse(contentString);

    // 3. Save to Supabase (UPSERT so we don't duplicate, and we update if it exists)
    const { error: upsertError } = await supabase
      .from('obd_codes')
      .upsert({
        code: safeCode,
        make: safeMake,
        title: aiData.title || safeTitle,
        description: aiData.description,
        symptoms: aiData.symptoms,
        causes: aiData.causes,
        fixes: aiData.fixes,
        estimated_cost: aiData.estimated_cost,
        quick_answer: aiData.quick_answer,
        severity: aiData.severity,
        drivability: aiData.drivability,
        faqs: aiData.faqs,
        is_ai_generated: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'code, make' });

    if (upsertError) {
      console.error("Supabase Upsert Error:", upsertError);
      throw new Error("Failed to save AI generated data to database");
    }

    // 4. Return the enriched data
    return new Response(JSON.stringify(aiData), {
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
