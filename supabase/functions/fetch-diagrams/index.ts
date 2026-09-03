import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { make, model, year, category, rawQuery, rawCacheKey } = await req.json()
    const cacheKey = rawCacheKey || `diagram_${year}_${make}_${model}_${category}`.toLowerCase().replace(/\s+/g, '_')

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Check Cache
    const { data: cached } = await supabase
      .from('diagram_cache')
      .select('images')
      .eq('cache_key', cacheKey)
      .single()

    if (cached?.images) {
      console.log('Returning cached diagrams for', cacheKey)
      return new Response(
        JSON.stringify({ images: cached.images }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Fetch from DuckDuckGo Image Search
    console.log('Scraping DDG for', cacheKey)
    const query = rawQuery 
      ? rawQuery.replace(/\s+/g, '+')
      : `${year} ${make} ${model} ${category} parts diagram exploded`.replace(/\s+/g, '+')
    
    // Step A: Get VQD token
    const htmlRes = await fetch(`https://duckduckgo.com/?q=${query}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    })
    const html = await htmlRes.text()
    const vqdMatch = html.match(/vqd=(["']?)([\d-]+)\1/)
    if (!vqdMatch) throw new Error('Could not extract VQD token from DDG')
    const vqd = vqdMatch[2]

    // Step B: Hit internal image API
    const imgRes = await fetch(`https://duckduckgo.com/i.js?q=${query}&vqd=${vqd}&p=-1`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    })
    const imgData = await imgRes.json()
    
    // Extract top 10 image URLs, prioritizing the DDG proxy thumbnail to avoid 403 hotlink errors
    const images = imgData.results.slice(0, 10).map((r: any) => r.thumbnail || r.image)

    // 3. Save to Supabase Cache
    if (images.length > 0) {
      await supabase.from('diagram_cache').upsert({
        cache_key: cacheKey,
        images: images,
        updated_at: new Date().toISOString()
      }, { onConflict: 'cache_key' })
    }

    return new Response(
      JSON.stringify({ images }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error fetching diagrams:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
