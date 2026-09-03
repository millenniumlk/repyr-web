code = '''
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
  Info
} from 'lucide-react';

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
                  onClick={() => setActiveCategory(cat.id)}
                  className={\w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer \\}
                >
                  <div className="flex items-center gap-3">
                    <cat.icon className={\w-4 h-4 \\} />
                    <span>{cat.name}</span>
                  </div>
                  <ChevronRight className={\w-4 h-4 transition-transform \\} />
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="flex-1">
        {activeCategory ? (
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Info className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Diagrams Coming Soon</h3>
            <p className="text-muted-foreground max-w-md">
              You selected the <strong>{CATEGORIES.find(c => c.id === activeCategory)?.name}</strong> category for the {year} {make} {model}. 
              We are currently building the integration to fetch exploded diagrams for this specific assembly.
            </p>
            <button 
              onClick={() => setActiveCategory(null)}
              className="mt-6 px-6 py-2 bg-muted text-foreground font-semibold rounded-xl hover:bg-muted/80 transition-colors cursor-pointer"
            >
              Back to Categories
            </button>
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
                  onClick={() => setActiveCategory(cat.id)}
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
'''

with open('src/components/OEMPartsCatalog.tsx', 'w', encoding='utf-8') as f:
    f.write(code.strip())
