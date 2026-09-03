import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Wrench, 
  CircleDashed, 
  Car, 
  Shield, 
  Zap, 
  PenTool, 
  Droplet,
  ChevronRight,
  Info,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
}

const CATEGORIES: Category[] = [
  { id: 'engine', name: 'Engine', description: 'Engine block, cylinder head, pistons, crankshaft, exhaust, fuel, cooling.', icon: Settings },
  { id: 'transmission', name: 'Transmission/Drivetrain', description: 'Clutch, gearbox, driveshafts, differentials, transfer case, AWD/4WD.', icon: Wrench },
  { id: 'chassis', name: 'Chassis Systems', description: 'Suspension, steering, brakes, wheels, hubs, bearings, control arms.', icon: CircleDashed },
  { id: 'body', name: 'Body/Exterior', description: 'Body panels, doors, bumpers, fenders, hood, trunk, glass, exterior lighting.', icon: Car },
  { id: 'interior', name: 'Interior/Safety', description: 'Seats, dashboard, trim panels, seatbelts, airbags, carpets.', icon: Shield },
  { id: 'electrical', name: 'Electrical/Electronic', description: 'Wiring harnesses, sensors, control modules, battery, starter, alternator.', icon: Zap },
  { id: 'accessories', name: 'Accessories/Tools', description: 'Floor mats, cargo accessories, towing gear, jack, spare tire tools.', icon: PenTool },
  { id: 'maintenance', name: 'Maintenance Parts', description: 'Filters, belts, spark plugs, wiper blades, brake pads, fluids.', icon: Droplet }
];

interface OEMPartsCatalogProps {
  make: string;
  model: string;
  year: string;
}

export function OEMPartsCatalog({ make, model, year }: OEMPartsCatalogProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [diagrams, setDiagrams] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSelectCategory = async (catId: string) => {
    setActiveCategory(catId);
    setIsLoading(true);
    setDiagrams([]);
    setError(null);
    
    const catName = CATEGORIES.find(c => c.id === catId)?.name || catId;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-diagrams', {
        body: { make, model, year, category: catName }
      });

      if (fnError) throw fnError;
      if (data?.images) {
        setDiagrams(data.images);
      } else {
        throw new Error('No diagrams found');
      }
    } catch (err: any) {
      console.error('Failed to load diagrams:', err);
      setError(err.message || 'Could not fetch diagrams. Ensure Edge Function is deployed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 mt-6">
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-card border border-border rounded-2xl p-4 sticky top-24 shadow-sm">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4 px-2">Categories</h3>
          <nav className="space-y-1">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`}
                >
                  <div className="flex items-center gap-3">
                    <cat.icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span>{cat.name}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'opacity-100 translate-x-1' : 'opacity-0'}`} />
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="flex-1">
        {activeCategory ? (
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm min-h-[400px]">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
              <h3 className="text-xl font-bold">{CATEGORIES.find(c => c.id === activeCategory)?.name} Diagrams</h3>
              <button 
                onClick={() => setActiveCategory(null)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
            </div>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-medium">Scraping OEM databases...</p>
                <p className="text-xs text-muted-foreground mt-2">Checking Supabase cache for {year} {make} {model}</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Info className="w-10 h-10 text-destructive mb-4" />
                <p className="text-destructive font-bold mb-2">Error loading diagrams</p>
                <p className="text-muted-foreground text-sm max-w-md">{error}</p>
              </div>
            ) : diagrams.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {diagrams.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group block rounded-xl overflow-hidden border border-border bg-slate-50 dark:bg-slate-900/50 aspect-video relative hover:border-primary/50 transition-colors">
                    <img 
                      src={url} 
                      alt="Part Diagram" 
                      className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-lighten"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 bg-background/90 text-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-sm backdrop-blur-sm transition-all transform translate-y-2 group-hover:translate-y-0">
                        View Full Size
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-muted-foreground font-medium">No diagrams found for this assembly.</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tight">{year} Genuine OEM Parts</h2>
              <span className="text-sm font-medium bg-muted text-muted-foreground px-3 py-1 rounded-full">Global Catalog</span>
            </div>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {CATEGORIES.map((cat, idx) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleSelectCategory(cat.id)}
                  className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all text-left cursor-pointer"
                >
                  <div className="h-32 bg-slate-50 dark:bg-slate-900/50 w-full relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                    <cat.icon className="w-16 h-16 text-slate-300 dark:text-slate-700 group-hover:scale-110 group-hover:text-primary/40 transition-transform duration-500" />
                  </div>
                  <div className="p-4 border-t border-border/50">
                    <h3 className="font-bold text-base mb-1.5 group-hover:text-primary transition-colors">{cat.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{cat.description}</p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
