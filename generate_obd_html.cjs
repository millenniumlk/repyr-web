require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  console.log('Generating static HTML for OBD codes...');

  const distDir = path.join(__dirname, 'dist');
  const indexHtmlPath = path.join(distDir, 'index.html');
  
  if (!fs.existsSync(indexHtmlPath)) {
    console.error('dist/index.html not found. Run this after build.');
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  let hasMore = true;
  let offset = 0;
  let totalGenerated = 0;

  while (hasMore) {
    const { data: obdCodes, error } = await supabase
      .from('obd_codes')
      .select('code, title, quick_answer, description')
      .eq('make', 'Generic')
      .range(offset, offset + 999);
      
    if (error) {
      console.error('Error fetching OBD codes:', error);
      break;
    }

    if (obdCodes && obdCodes.length > 0) {
      for (const c of obdCodes) {
        const codeDir = path.join(distDir, 'obd', c.code);
        fs.mkdirSync(codeDir, { recursive: true });

        const title = `${c.code} - ${c.title || 'OBD2 Code'} | Repyr`;
        const description = (c.quick_answer || c.description || `Diagnose and fix the ${c.code} OBD2 code.`).substring(0, 160).replace(/"/g, '&quot;');
        
        let html = baseHtml.replace(
          /<title>.*?<\/title>/,
          `<title>${title}</title>`
        );
        html = html.replace(
          /content="Repyr - Free OBD-II Code Lookup & Car Diagnostics"/g,
          `content="${title}"`
        );
        html = html.replace(
          /content="Instantly diagnose your car's check engine light for free with AI\. Lookup OBD2 codes, get repair estimates, and track your vehicle maintenance\."/g,
          `content="${description}"`
        );
        
        // Add meta description for regular search engines just in case
        html = html.replace(
          '</head>',
          `  <meta name="description" content="${description}" />\n  </head>`
        );

        const h1 = `<h1>${c.code}: ${c.title || 'Diagnostic Code'}</h1>`;
        const p = `<p>${c.quick_answer || c.description || ''}</p>`;
        html = html.replace('<div id="root"></div>', `<div id="root">${h1}${p}</div>`);

        fs.writeFileSync(path.join(codeDir, 'index.html'), html);
        totalGenerated++;
      }
      offset += 1000;
    } else {
      hasMore = false;
    }
  }

  console.log(`Generated ${totalGenerated} static OBD HTML pages in dist/obd/.`);
}

run();
