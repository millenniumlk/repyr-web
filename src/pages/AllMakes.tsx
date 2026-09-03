import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { HomeHeader } from '../components/HomeHeader';

const EXTENDED_BRANDS = [
  { name: 'Acura', url: 'acura' },
  { name: 'Alfa Romeo', url: 'alfa-romeo' },
  { name: 'Aston Martin', url: 'aston-martin' },
  { name: 'Audi', url: 'audi' },
  { name: 'Bentley', url: 'bentley' },
  { name: 'BMW', url: 'bmw' },
  { name: 'Bugatti', url: 'bugatti' },
  { name: 'Buick', url: 'buick' },
  { name: 'Cadillac', url: 'cadillac' },
  { name: 'Chevrolet', url: 'chevrolet' },
  { name: 'Chrysler', url: 'chrysler' },
  { name: 'Citroen', url: 'citroen' },
  { name: 'Dodge', url: 'dodge' },
  { name: 'Ferrari', url: 'ferrari' },
  { name: 'Fiat', url: 'fiat' },
  { name: 'Ford', url: 'ford' },
  { name: 'Genesis', url: 'genesis' },
  { name: 'GMC', url: 'gmc' },
  { name: 'Honda', url: 'honda' },
  { name: 'Hyundai', url: 'hyundai' },
  { name: 'Infiniti', url: 'infiniti' },
  { name: 'Jaguar', url: 'jaguar' },
  { name: 'Jeep', url: 'jeep' },
  { name: 'Kia', url: 'kia' },
  { name: 'Lamborghini', url: 'lamborghini' },
  { name: 'Land Rover', url: 'land-rover' },
  { name: 'Lexus', url: 'lexus' },
  { name: 'Lincoln', url: 'lincoln' },
  { name: 'Maserati', url: 'maserati' },
  { name: 'Mazda', url: 'mazda' },
  { name: 'McLaren', url: 'mclaren' },
  { name: 'Mercedes', url: 'mercedes-benz' },
  { name: 'Mini', url: 'mini' },
  { name: 'Mitsubishi', url: 'mitsubishi' },
  { name: 'Nissan', url: 'nissan' },
  { name: 'Peugeot', url: 'peugeot' },
  { name: 'Porsche', url: 'porsche' },
  { name: 'Ram', url: 'ram' },
  { name: 'Rolls-Royce', url: 'rolls-royce' },
  { name: 'Subaru', url: 'subaru' },
  { name: 'Suzuki', url: 'suzuki' },
  { name: 'Tesla', url: 'tesla' },
  { name: 'Toyota', url: 'toyota' },
  { name: 'Volkswagen', url: 'volkswagen' },
  { name: 'Volvo', url: 'volvo' }
].sort((a, b) => a.name.localeCompare(b.name));

export default function AllMakes() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBrands = EXTENDED_BRANDS.filter(brand => 
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans overflow-x-hidden">
      <Helmet>
        <title>All Vehicle Makes | Repyr</title>
        <meta name="description" content="Browse all car manufacturers to view safety ratings, common issues, and recalls." />
      </Helmet>
      
      <HomeHeader />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 w-full">
          <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4">
            Browse <span className="text-primary">All Makes</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select a manufacturer to explore vehicle models, safety data, and consumer complaints.
          </p>
        </div>

        <div className="w-full max-w-4xl mx-auto mb-10">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search manufacturers (e.g., Tesla, Ferrari, Jeep)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-11 pr-4 py-4 bg-card border border-border rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-lg shadow-sm"
            />
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4"
        >
          {filteredBrands.map((brand) => (
            <button
              key={brand.name}
              onClick={() => navigate('/cars/' + brand.name.toLowerCase())}
              className="group relative flex flex-col items-center justify-center p-4 rounded-2xl border bg-card border-border hover:border-primary/20 hover:bg-muted/40 transition-all cursor-pointer shadow-sm hover:shadow-md text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 mb-3 flex items-center justify-center">
                <img 
                  src={'https://www.carlogos.org/car-logos/' + brand.url + '-logo.png'} 
                  alt={brand.name + ' logo'}
                  className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<span class="text-xl font-black text-foreground/80">' + brand.name.slice(0,2).toUpperCase() + '</span>';
                  }}
                />
              </div>
              <span className="font-semibold text-sm sm:text-base text-foreground/90 group-hover:text-primary transition-colors">
                {brand.name}
              </span>
            </button>
          ))}
        </motion.div>

        {filteredBrands.length === 0 && (
          <div className="py-20 text-center text-muted-foreground text-lg">
            No manufacturers found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}