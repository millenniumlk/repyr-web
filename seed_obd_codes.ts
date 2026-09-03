import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables from .env
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// The top 50 most common OBD-II codes to seed the database
const topObdCodes = [
  { code: 'P0101', title: 'Mass Air Flow (MAF) Circuit/Performance' },
  { code: 'P0113', title: 'Intake Air Temperature Circuit High Input' },
  { code: 'P0128', title: 'Coolant Thermostat (Coolant Temperature Below Thermostat Regulating Temperature)' },
  { code: 'P0135', title: 'O2 Sensor Heater Circuit Malfunction (Bank 1 Sensor 1)' },
  { code: 'P0141', title: 'O2 Sensor Heater Circuit Malfunction (Bank 1 Sensor 2)' },
  { code: 'P0171', title: 'System Too Lean (Bank 1)' },
  { code: 'P0174', title: 'System Too Lean (Bank 2)' },
  { code: 'P0300', title: 'Random/Multiple Cylinder Misfire Detected' },
  { code: 'P0301', title: 'Cylinder 1 Misfire Detected' },
  { code: 'P0302', title: 'Cylinder 2 Misfire Detected' },
  { code: 'P0303', title: 'Cylinder 3 Misfire Detected' },
  { code: 'P0304', title: 'Cylinder 4 Misfire Detected' },
  { code: 'P0340', title: 'Camshaft Position Sensor Circuit Malfunction' },
  { code: 'P0401', title: 'Exhaust Gas Recirculation Flow Insufficient Detected' },
  { code: 'P0420', title: 'Catalyst System Efficiency Below Threshold (Bank 1)' },
  { code: 'P0430', title: 'Catalyst System Efficiency Below Threshold (Bank 2)' },
  { code: 'P0440', title: 'Evaporative Emission Control System Malfunction' },
  { code: 'P0442', title: 'Evaporative Emission Control System Leak Detected (small leak)' },
  { code: 'P0455', title: 'Evaporative Emission Control System Leak Detected (gross leak)' },
  { code: 'P0500', title: 'Vehicle Speed Sensor Malfunction' },
  { code: 'P0700', title: 'Transmission Control System Malfunction' }
];

async function seedDatabase() {
  console.log(`Starting to seed ${topObdCodes.length} codes...`);
  
  let successCount = 0;
  
  for (const item of topObdCodes) {
    const { error } = await supabase
      .from('obd_codes')
      .upsert({ 
        code: item.code, 
        make: 'Generic', 
        title: item.title,
        is_ai_generated: false
      }, { onConflict: 'code, make' });
      
    if (error) {
      console.error(`Error inserting ${item.code}:`, error.message);
    } else {
      successCount++;
    }
  }
  
  console.log(`Successfully seeded ${successCount}/${topObdCodes.length} codes.`);
}

seedDatabase();
