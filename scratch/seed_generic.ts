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

async function seedGenerics() {
  const sourceDir = path.resolve(__dirname, 'dtc-database/data/source-data');
  const targetFiles = ['b_codes.txt', 'c_codes.txt', 'u_codes.txt'];
  
  let allCodesToInsert = [];
  
  for (const file of targetFiles) {
    const content = fs.readFileSync(path.join(sourceDir, file), 'utf-8');
    const lines = content.split(/\r?\n/);
    
    let fileCount = 0;
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const match = line.match(/^([A-Z0-9]+)\s+-\s+(.+)$/);
      if (match) {
        allCodesToInsert.push({
          code: match[1].toUpperCase().trim(),
          make: 'Generic',
          title: match[2].trim(),
          is_ai_generated: false
        });
        fileCount++;
      }
    }
    console.log(`Parsed ${fileCount} generic codes from ${file}`);
  }
  
  // Deduplicate before inserting to avoid ON CONFLICT errors
  const uniqueCodesMap = new Map();
  for (const item of allCodesToInsert) {
    const key = `${item.code}-${item.make}`;
    if (!uniqueCodesMap.has(key)) {
      uniqueCodesMap.set(key, item);
    }
  }
  
  const uniqueCodesToInsert = Array.from(uniqueCodesMap.values());
  console.log(`Total UNIQUE generic codes to insert: ${uniqueCodesToInsert.length}`);
  
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
      console.log(`Successfully inserted ${successCount}/${uniqueCodesToInsert.length} codes...`);
    }
  }
  
  console.log('Finished seeding generic B, C, U codes!');
}

seedGenerics();
