import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Using anon key as long as RLS allows upsert, or service role key if needed.
// Wait, we need the SERVICE_ROLE key or disable RLS for upserting.
// In this dev environment, anon key might work if RLS is disabled or allows anon insert. Let's try anon key first.

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
  const csvData = fs.readFileSync(resolve(__dirname, 'obd-trouble-codes/obd-trouble-codes.csv'), 'utf-8');
  const lines = csvData.split('\n');
  
  const codesToInsert = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const matches = line.match(/^"([^"]+)","([^"]+)"/);
    if (matches && matches.length === 3) {
      codesToInsert.push({
        code: matches[1].toUpperCase(),
        make: 'Generic',
        title: matches[2],
        is_ai_generated: false
      });
    }
  }
  
  console.log(`Found ${codesToInsert.length} codes in CSV.`);
  
  const batchSize = 500;
  let successCount = 0;
  
  for (let i = 0; i < codesToInsert.length; i += batchSize) {
    const batch = codesToInsert.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('obd_codes')
      .upsert(batch, { onConflict: 'code,make' });
      
    if (error) {
      console.error(`Error inserting batch ${i}:`, error);
    } else {
      successCount += batch.length;
      console.log(`Successfully inserted ${successCount}/${codesToInsert.length} codes...`);
    }
  }
  
  console.log('Finished seeding database!');
}

seedDatabase();
