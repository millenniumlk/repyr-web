import { useState } from 'react';
import { Car, ChevronRight, Battery, Thermometer, Gauge, Settings2, Wrench, Volume2, Disc } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../components/ui/Button';
import { useQuery } from '@tanstack/react-query';

const History = () => {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['diagnostic_sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('diagnostic_sessions')
        .select('*, vehicles(make, model)')
        .eq('status', 'diagnosis_complete')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const uniqueVehicles = Array.from(new Set(sessions.map(s => s.vehicles?.model || s.vehicle_model).filter(Boolean)));
  const filteredSessions = selectedFilter ? sessions.filter(s => (s.vehicles?.model || s.vehicle_model) === selectedFilter) : sessions;

  // Grouping Logic
  const groupedSessions = [
    { title: 'This Week', data: [] as any[] },
    { title: 'This Month', data: [] as any[] },
    { title: 'Older', data: [] as any[] }
  ];

  const now = new Date().getTime();
  filteredSessions.forEach(session => {
    const sessionTime = new Date(session.created_at).getTime();
    const diffDays = (now - sessionTime) / (1000 * 3600 * 24);

    if (diffDays <= 7) groupedSessions[0].data.push(session);
    else if (diffDays <= 30) groupedSessions[1].data.push(session);
    else groupedSessions[2].data.push(session);
  });

  const getCategoryIcon = (category: string, cause: string) => {
    const text = `${category || ''} ${cause || ''}`.toLowerCase();
    
    if (text.includes('battery') || text.includes('start') || text.includes('electrical') || text.includes('alternator')) return Battery;
    if (text.includes('overheat') || text.includes('coolant') || text.includes('radiator') || text.includes('thermostat')) return Thermometer;
    if (text.includes('engine') || text.includes('acceleration') || text.includes('misfire') || text.includes('power')) return Gauge;
    if (text.includes('transmission') || text.includes('gear') || text.includes('shift') || text.includes('clutch')) return Settings2;
    if (text.includes('brake') || text.includes('pad') || text.includes('rotor') || text.includes('stop')) return Disc;
    if (text.includes('noise') || text.includes('rattle') || text.includes('squeak') || text.includes('grinding')) return Volume2;
    
    return Wrench;
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto pb-10 px-4 md:px-0">
        <div className="hidden md:block mb-6 px-1 mt-2">
          <div className="h-9 w-48 bg-muted animate-pulse rounded-xl" />
        </div>
        <div className="flex gap-2 pb-4 pt-1 px-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-20 bg-muted animate-pulse rounded-full" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-[20px] p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-16 bg-muted animate-pulse rounded-lg" />
                <div className="h-5 w-2/3 bg-muted animate-pulse rounded-lg" />
                <div className="h-4 w-1/2 bg-muted animate-pulse rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-10 px-4 md:px-0">
      <div className="hidden md:block mb-6 px-1 mt-2">
        <h1 className="text-3xl font-bold text-black tracking-tight leading-tight">Diagnostic Logs</h1>
      </div>

      {sessions.length > 0 && uniqueVehicles.length > 0 && (
        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-4 pt-1 px-1">
          <Button
            variant={!selectedFilter ? "default" : "outline"}
            size="chip"
            onClick={() => setSelectedFilter(null)}
            className="whitespace-nowrap px-5 py-2.5"
          >
            All Logs
          </Button>
          
          {uniqueVehicles.map((vehicle: any) => (
            <Button
              key={vehicle}
              variant={selectedFilter === vehicle ? "default" : "outline"}
              size="chip"
              onClick={() => setSelectedFilter(vehicle)}
              className="whitespace-nowrap px-5 py-2.5"
            >
              {vehicle}
            </Button>
          ))}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center max-w-md px-4"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-primary/20">
              <Car className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight mb-3">No Diagnostic logs Yet</h2>
            <p className="text-muted-foreground leading-relaxed">
              Diagnostic sessions will be recorded here once you analyze a vehicle.
            </p>
          </motion.div>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedSessions.filter(group => group.data.length > 0).map((group, groupIdx) => (
            <div key={groupIdx} className="px-1">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3 ml-2 mt-2">
                {group.title}
              </h4>
              <div className="space-y-4">
                <AnimatePresence>
                  {group.data.map((session, index) => {
                    const probability = session.final_probabilities?.[0];
                    const make = session.vehicles?.make || session.vehicle_make || 'Unknown Make';
                    const model = session.vehicles?.model || session.vehicle_model || 'Unknown Vehicle';
                    const date = new Date(session.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', month: 'short', day: 'numeric' 
                    });

                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 0.98 }}
                        whileTap={{ scale: 0.96 }}
                        key={session.id} 
                        className="bg-white border border-gray-100/80 rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] cursor-pointer flex flex-row items-center gap-4"
                      >
                        <div className="w-[46px] h-[46px] rounded-full bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                          {(() => {
                            const IconComponent = getCategoryIcon(session.category, probability?.cause);
                            return <IconComponent className="w-5 h-5 text-primary" strokeWidth={2.2} />;
                          })()}
                        </div>
                        
                        <div className="flex-1 min-w-0 py-0.5">
                          <div className="flex items-center mb-1">
                            <span className="text-gray-400 font-bold text-[11px] uppercase tracking-widest">{date}</span>
                          </div>
                          
                          {probability && (
                            <div className="text-gray-900 font-bold text-[15px] leading-snug truncate mb-0.5">
                              {probability.cause}
                            </div>
                          )}
                          
                          <div className="text-gray-500 font-medium text-sm truncate">
                            {make} {model}
                          </div>
                        </div>
                        
                        <div className="pr-1">
                          <ChevronRight className="w-5 h-5 text-gray-300" strokeWidth={2} />
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;

