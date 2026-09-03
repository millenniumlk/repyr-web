import re

with open('supabase/functions/fetch-diagrams/index.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace extraction and query generation
old_block = \"\"\"    const { make, model, year, category } = await req.json()
    const cacheKey = \diagram_\_\_\_\\.toLowerCase().replace(/\s+/g, '_')\"\"\"

new_block = \"\"\"    const { make, model, year, category, rawQuery, rawCacheKey } = await req.json()
    
    const cacheKey = rawCacheKey 
      ? rawCacheKey 
      : \diagram_\_\_\_\\.toLowerCase().replace(/\s+/g, '_')\"\"\"

content = content.replace(old_block, new_block)

old_query_block = \"\"\"    // 2. Fetch from DuckDuckGo Image Search
    console.log('Scraping DDG for', cacheKey)
    const query = \\ \ \ \ parts diagram exploded\.replace(/\s+/g, '+')\"\"\"

new_query_block = \"\"\"    // 2. Fetch from DuckDuckGo Image Search
    console.log('Scraping DDG for', cacheKey)
    const query = rawQuery 
      ? rawQuery.replace(/\s+/g, '+') 
      : \\ \ \ \ parts diagram exploded\.replace(/\s+/g, '+')\"\"\"

content = content.replace(old_query_block, new_query_block)

with open('supabase/functions/fetch-diagrams/index.ts', 'w', encoding='utf-8') as f:
    f.write(content)
