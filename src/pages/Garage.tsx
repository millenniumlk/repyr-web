import { Trash2, Plus, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../lib/ToastContext';
import { Button } from '../components/ui/Button';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const Garage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const handleDeleteVehicle = async (id: string, make: string, model: string) => {
    if (window.confirm(`Are you sure you want to remove this ${make} ${model}?`)) {
      // Detach diagnostic sessions from this vehicle before deleting it
      // so they aren't cascade-deleted. This prevents users from bypassing daily chat limits.
      await supabase.from('diagnostic_sessions').update({ vehicle_id: null }).eq('vehicle_id', id);

      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (!error) {
        queryClient.setQueryData(['vehicles', user?.id], (old: any[]) => 
          old ? old.filter(v => v.id !== id) : []
        );
        showToast(`Vehicle removed.`, 'success');
      } else {
        showToast('Could not delete vehicle.', 'error');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto pb-10 px-4 md:px-0">
        <div className="mb-6 px-1 mt-2">
          <div className="hidden md:block h-9 w-40 bg-muted animate-pulse rounded-xl" />
        </div>
        <div className="mt-4 px-1 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-[20px] p-4 flex items-center gap-4">
              <div className="w-[46px] h-[46px] rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 bg-muted animate-pulse rounded-lg" />
                <div className="h-4 w-1/3 bg-muted animate-pulse rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-10 px-4 md:px-0">
      <div className="mb-6 px-1 mt-2">
        <h1 className="hidden md:block text-3xl font-bold text-black tracking-tight leading-tight mb-6">Your Garage</h1>
      </div>

      {vehicles.length === 0 ? (
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
            <h2 className="text-2xl font-bold text-foreground tracking-tight mb-3">
              Your Garage is Empty
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Add a vehicle to manage its profile and get AI-powered diagnostics.
            </p>
            <Link to="/garage/add">
              <Button className="mx-auto">
                <Plus className="w-5 h-5 mr-2" strokeWidth={2.2} />
                Add Vehicle
              </Button>
            </Link>
          </motion.div>
        </div>
      ) : (
        <div className="mt-4 px-1 flex flex-col min-h-[calc(100vh-180px)]">
          <div className="space-y-4">
            <AnimatePresence>
                {vehicles.map((vehicle, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 0.98 }}
                    whileTap={{ scale: 0.96 }}
                    key={vehicle.id} 
                    className="bg-white border border-gray-100/80 rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] cursor-pointer flex flex-row items-center gap-4"
                  >
                    <div className="w-[46px] h-[46px] rounded-full bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                      <Car className="w-5 h-5 text-primary" strokeWidth={2.2} />
                    </div>

                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="text-black font-medium text-base leading-snug truncate mb-0.5">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </div>
                      {vehicle.mileage ? (
                        <div className="text-gray-500 font-medium text-sm truncate">
                          {Number(vehicle.mileage).toLocaleString()} km
                        </div>
                      ) : null}
                    </div>
                    
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVehicle(vehicle.id, vehicle.make, vehicle.model);
                      }}
                      className="h-11 w-11 rounded-full hover:bg-red-50 text-red-400 hover:text-red-600 group shrink-0"
                      title="Remove Vehicle"
                    >
                      <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            <div className="mt-auto pt-6 w-full">
              <Link to="/garage/add" className="block">
                <Button className="w-full">
                  <Plus className="w-5 h-5 mr-2" strokeWidth={2.2} />
                  Add Vehicle
                </Button>
              </Link>
            </div>
          </div>
        )}
    </div>
  );
};

export default Garage;
