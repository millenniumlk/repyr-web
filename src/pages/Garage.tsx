import { Trash2, Plus, Loader2, Car } from 'lucide-react';
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
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            <div className="bg-primary rounded-[28px] overflow-hidden shadow-sm shadow-primary/20 hover:shadow-md transition-all mx-auto w-fit">
              <Link 
                to="/garage/add"
                className="flex items-center justify-center px-6 py-3.5 hover:bg-primary/90 transition-colors group"
              >
                <div className="mr-2 text-white">
                  <Plus className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <span className="text-[15px] tracking-tight font-medium text-white">
                  Add Vehicle
                </span>
              </Link>
            </div>
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
                    key={vehicle.id} 
                    className="bg-white border border-gray-100/80 rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] cursor-pointer flex flex-row items-center gap-4"
                  >
                    <div className="w-[46px] h-[46px] rounded-full bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                      <Car className="w-5 h-5 text-primary" strokeWidth={2.2} />
                    </div>

                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="text-black font-medium text-[16px] leading-snug truncate mb-0.5">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </div>
                      {vehicle.mileage ? (
                        <div className="text-gray-500 font-medium text-[13px] truncate">
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
              <div className="bg-primary rounded-[28px] overflow-hidden shadow-sm shadow-primary/20 hover:shadow-md transition-all">
                <Link 
                  to="/garage/add"
                  className="w-full flex items-center justify-center px-5 py-4 hover:bg-primary/90 transition-colors group"
                >
                  <div className="mr-3 text-white">
                    <Plus className="w-[22px] h-[22px]" strokeWidth={2.2} />
                  </div>
                  <span className="text-[16px] tracking-tight font-medium text-white">
                    Add Vehicle
                  </span>
                </Link>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Garage;
