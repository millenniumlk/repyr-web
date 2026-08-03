import { useState, useEffect } from 'react';
import { Trash2, Plus, Loader2, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

const Garage = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      setIsLoading(true);
      if (user) {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (!error && data) {
          setVehicles(data);
        }
      }
      setIsLoading(false);
    };

    fetchVehicles();
  }, [user]);

  const handleDeleteVehicle = async (id: string, make: string, model: string) => {
    if (window.confirm(`Are you sure you want to remove this ${make} ${model}?`)) {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (!error) {
        setVehicles(prev => prev.filter(v => v.id !== id));
      } else {
        alert('Could not delete vehicle.');
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
      <div className="flex justify-between items-center mb-6 px-1 mt-2">
        <h1 className="hidden md:block text-3xl font-bold text-black tracking-tight leading-tight">Your Garage</h1>
        <Link to="/garage/add" className="hidden md:flex bg-[#0062FF] text-white px-5 py-2.5 rounded-full font-semibold text-[15px] items-center hover:bg-[#004CCC] transition-colors shadow-[0_2px_8px_rgba(0,98,255,0.2)]">
          <Plus className="w-5 h-5 mr-1" strokeWidth={2.5} />
          Add Vehicle
        </Link>
      </div>

      <div className="mt-4 px-1 space-y-4">
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
                <div className="text-gray-900 font-bold text-[16px] leading-snug truncate mb-0.5">
                  {vehicle.year} {vehicle.make} <span className="text-primary">{vehicle.model}</span>
                </div>
                {vehicle.mileage ? (
                  <div className="text-gray-500 font-medium text-[13px] truncate">
                    {vehicle.mileage.toLocaleString()} miles
                  </div>
                ) : null}
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteVehicle(vehicle.id, vehicle.make, vehicle.model);
                }}
                className="p-3 rounded-full hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors group flex items-center justify-center shrink-0"
                title="Remove Vehicle"
              >
                <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {vehicles.length === 0 && (
        <div className="items-center w-full max-w-[600px] self-center mx-auto mt-12">
          <div className="bg-white border border-gray-100 rounded-[32px] p-10 flex flex-col items-center text-center shadow-sm">
            <div className="w-[72px] h-[72px] rounded-full bg-gray-50 flex items-center justify-center mb-6 border border-gray-100/50">
              <Car color="#9CA3AF" size={32} strokeWidth={2} />
            </div>
            <h2 className="text-[22px] font-bold text-gray-900 tracking-tight mb-2">Your Garage is Empty</h2>
            <p className="text-gray-500 font-medium text-[15px] leading-relaxed max-w-[280px]">
              Add your vehicles to get personalized AI diagnostics and service recommendations.
            </p>
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Button */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-20">
        <Link to="/garage/add" className="bg-[#0062FF] text-white w-full py-4 rounded-[20px] font-bold text-[17px] flex items-center justify-center hover:bg-[#004CCC] transition-colors shadow-[0_8px_24px_rgba(0,98,255,0.25)]">
          <Plus className="w-6 h-6 mr-1" strokeWidth={2.5} />
          Add Vehicle
        </Link>
      </div>
    </div>
  );
};

export default Garage;
