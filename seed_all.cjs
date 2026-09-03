require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const brands = [
    'Acura', 'Alfa Romeo', 'Aston Martin', 'Audi', 'Bentley', 'BMW', 'Bugatti', 'Buick',
    'Cadillac', 'Chevrolet', 'Chrysler', 'Citroen', 'Dodge', 'Ferrari', 'Fiat', 'Ford',
    'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 'Kia',
    'Lamborghini', 'Land Rover', 'Lexus', 'Lincoln', 'Maserati', 'Mazda', 'McLaren',
    'Mercedes-Benz', 'Mini', 'Mitsubishi', 'Nissan', 'Peugeot', 'Porsche', 'Ram',
    'Rolls-Royce', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
  ];

  for (const make of brands) {
    const cacheKey = `models_${make}`.toLowerCase();
    console.log('Fetching', make);
    try {
      const res = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/' + encodeURIComponent(make) + '?format=json');
      const data = await res.json();
      if (data.Results && data.Results.length > 0) {
        await supabase.from('nhtsa_cache').upsert({
          cache_key: cacheKey,
          data: data.Results,
          updated_at: new Date().toISOString()
        }, { onConflict: 'cache_key' });
        console.log('Saved', make, data.Results.length, 'models');
      } else {
        console.log('No models found for', make);
      }
    } catch (e) {
      console.error('Error fetching', make, e.message);
    }
  }
}
run();
