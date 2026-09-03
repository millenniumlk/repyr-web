require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  console.log('Fetching data for sitemap...');

  const urls = [];
  const BASE_URL = 'https://repyrai.com';

  // Static URLs
  const statics = ['/', '/cars', '/obd', '/diagnose'];
  for (const s of statics) {
    urls.push(`<url><loc>${BASE_URL}${s}</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`);
  }

  // All Makes
  const brands = [
    'acura', 'alfa-romeo', 'aston-martin', 'audi', 'bentley', 'bmw', 'bugatti', 'buick',
    'cadillac', 'chevrolet', 'chrysler', 'citroen', 'dodge', 'ferrari', 'fiat', 'ford',
    'genesis', 'gmc', 'honda', 'hyundai', 'infiniti', 'jaguar', 'jeep', 'kia',
    'lamborghini', 'land-rover', 'lexus', 'lincoln', 'maserati', 'mazda', 'mclaren',
    'mercedes-benz', 'mini', 'mitsubishi', 'nissan', 'peugeot', 'porsche', 'ram',
    'rolls-royce', 'subaru', 'suzuki', 'tesla', 'toyota', 'volkswagen', 'volvo'
  ];

  for (const b of brands) {
    urls.push(`<url><loc>${BASE_URL}/cars/${b}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
  }

  // All Models from Cache
  const { data: cacheData } = await supabase.from('nhtsa_cache').select('cache_key, data').like('cache_key', 'models_%');
  if (cacheData) {
    for (const row of cacheData) {
      let make = row.cache_key.replace('models_', '').replace(' ', '-'); 
      if (row.data && Array.isArray(row.data)) {
        for (const m of row.data) {
          if (m.Model_Name) {
            const mClean = encodeURIComponent(m.Model_Name.toLowerCase());
            urls.push(`<url><loc>${BASE_URL}/cars/${make}/${mClean}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`);
          }
        }
      }
    }
  }

  // OBD Codes - Paginated because Supabase limits to 1000 per request
  let hasMore = true;
  let offset = 0;
  while (hasMore) {
    const { data: obdCodes } = await supabase.from('obd_codes').select('code').eq('make', 'Generic').range(offset, offset + 999);
    if (obdCodes && obdCodes.length > 0) {
      for (const c of obdCodes) {
        urls.push(`<url><loc>${BASE_URL}/obd/${c.code}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`);
      }
      offset += 1000;
    } else {
      hasMore = false;
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  fs.writeFileSync('public/sitemap.xml', xml);
  console.log('Sitemap generated with ' + urls.length + ' URLs');
}
run();
