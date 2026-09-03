import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ignoreFiles = ['p_codes.txt', 'b_codes.txt', 'c_codes.txt', 'u_codes.txt', 'other_codes.txt', 'gm_codes.txt'];

function toTitleCase(str: string) {
  if (str.toLowerCase() === 'bmw') return 'BMW';
  if (str.toLowerCase() === 'gmc') return 'GMC';
  if (str.toLowerCase() === 'volkswagen') return 'Volkswagen';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

async function seedMakes() {
  const sourceDir = path.resolve(__dirname, 'dtc-database/data/source-data');
  const files = fs.readdirSync(sourceDir);
  
  let allCodesToInsert = [];
  
  for (const file of files) {
    if (!file.endsWith('_codes.txt') || ignoreFiles.includes(file)) {
      continue;
    }
    
    const makeRaw = file.replace('_codes.txt', '');
    const make = toTitleCase(makeRaw);
    
    const content = fs.readFileSync(path.join(sourceDir, file), 'utf-8');
    const lines = content.split(/\r?\n/);
    
    let fileCount = 0;
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const match = line.match(/^([A-Z0-9]+)\s+-\s+(.+)$/);
      if (match) {
        allCodesToInsert.push({
          code: match[1].toUpperCase().trim(),
          make: make,
          title: match[2].trim(),
          is_ai_generated: false
        });
        fileCount++;
      }
    }
    console.log(`Parsed ${fileCount} codes for ${make}`);
  }
  
  console.log(`Total parsed codes: ${allCodesToInsert.length}`);
  
  // Deduplicate before inserting to avoid ON CONFLICT errors
  const uniqueCodesMap = new Map();
  for (const item of allCodesToInsert) {
    const key = `${item.code}-${item.make}`;
    if (!uniqueCodesMap.has(key)) {
      uniqueCodesMap.set(key, item);
    }
  }
  
  const uniqueCodesToInsert = Array.from(uniqueCodesMap.values());
  console.log(`Total UNIQUE manufacturer-specific codes to insert: ${uniqueCodesToInsert.length}`);
  
  const batchSize = 1000;
  let successCount = 0;
  
  for (let i = 0; i < uniqueCodesToInsert.length; i += batchSize) {
    const batch = uniqueCodesToInsert.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('obd_codes')
      .upsert(batch, { onConflict: 'code,make' });
      
    if (error) {
      console.error(`Error inserting batch ${i}:`, error);
    } else {
      successCount += batch.length;
      console.log(`Successfully inserted ${successCount}/${allCodesToInsert.length} codes...`);
    }
  }
  
  console.log('Finished seeding manufacturer-specific codes!');
}

seedMakes();
