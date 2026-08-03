import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Car, MapPin, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { motion } from 'framer-motion';

const TRANSMISSION_TYPES = ['Automatic', 'Manual', 'Tiptronic'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric'];

const QuickSelect = ({ options, value, onChange }: { options: string[], value: string, onChange: (v: string) => void }) => (
  <div className="flex flex-wrap gap-2 mb-2">
    {options.map((opt) => (
      <button
        key={opt}
        type="button"
        onClick={() => onChange(value === opt ? '' : opt)}
        className={`px-4 py-2.5 rounded-xl border text-[14px] transition-all duration-200 font-medium ${
          value === opt 
            ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 scale-[0.98]' 
            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
        }`}
      >
        {opt}
      </button>
    ))}
  </div>
);

const AnimatedInput = ({ icon: Icon, label, ...props }: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = props.value !== undefined && props.value.toString().length > 0;
  
  return (
    <div className="mb-6 relative">
      <div 
        className={`relative flex items-center bg-white rounded-xl transition-all duration-300 ${
          isFocused 
            ? 'border-primary ring-4 ring-primary/20 shadow-lg shadow-primary/10' 
            : 'border-gray-200 border'
        }`}
      >
        <div className="pl-4 pr-3 text-muted-foreground z-10">
          <Icon className={`w-5 h-5 transition-colors ${isFocused ? 'text-primary' : ''}`} />
        </div>
        
        <div className="relative w-full flex flex-col justify-center h-14">
          {label && (
            <label 
              className={`absolute left-0 transition-all duration-200 pointer-events-none ${
                isFocused || hasValue 
                  ? 'text-[10px] -translate-y-2.5 font-bold text-primary tracking-wider uppercase' 
                  : 'text-[15px] text-gray-400 translate-y-0'
              }`}
            >
              {label}
            </label>
          )}
          <input 
            {...props}
            placeholder={isFocused && !hasValue ? props.placeholder : ''}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={`w-full pr-4 bg-transparent outline-none font-medium text-foreground transition-all ${
              (isFocused || hasValue) && label ? 'pt-4' : ''
            }`}
          />
        </div>
      </div>
    </div>
  );
};

const CompleteVehicleProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [transmission, setTransmission] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [baseVehicle, setBaseVehicle] = useState<any>(null);

  useEffect(() => {
    // Try to find the vehicle to complete
    const loadVehicle = async () => {
      // First check pending guest chat in local storage
      const pendingChatRaw = localStorage.getItem('pending_guest_chat');
      if (pendingChatRaw) {
        try {
          const pendingChat = JSON.parse(pendingChatRaw);
          if (pendingChat.vehicle) {
            setBaseVehicle(pendingChat.vehicle);
            return;
          }
        } catch (e) {}
      }

      // If no pending, check supabase for a vehicle missing details
      if (user) {
        const { data } = await supabase
          .from('vehicles')
          .select('*')
          .eq('user_id', user.id)
          .limit(1);
          
        if (data && data.length > 0) {
          setBaseVehicle(data[0]);
        }
      }
    };
    loadVehicle();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transmission || !fuelType || !location || !user) return;
    
    setIsSubmitting(true);
    
    try {
      if (baseVehicle?.id && baseVehicle.id !== 'guest-vehicle' && baseVehicle.id !== 'pending-vehicle') {
        // Update existing
        await supabase
          .from('vehicles')
          .update({
            transmission,
            fuel_type: fuelType,
            location
          })
          .eq('id', baseVehicle.id);
      } else if (baseVehicle) {
        // Insert new from pending
        await supabase
          .from('vehicles')
          .insert([{
            user_id: user.id,
            make: baseVehicle.make,
            model: baseVehicle.model,
            year: parseInt(baseVehicle.year),
            mileage: parseInt(baseVehicle.mileage) || 0,
            transmission,
            fuel_type: fuelType,
            location
          }]);
      }

      // Ensure we clear out pending so it doesn't duplicate
      // Wait, if we clear pending_guest_chat, the Home dashboard won't automatically start the symptom!
      // To fix this, we ONLY update the vehicle part of the pending chat, not clear the whole thing.
      const pendingChatRaw = localStorage.getItem('pending_guest_chat');
      if (pendingChatRaw) {
        try {
          const pendingChat = JSON.parse(pendingChatRaw);
          pendingChat.vehicle = {
            ...pendingChat.vehicle,
            transmission,
            fuel_type: fuelType,
            location
          };
          localStorage.setItem('pending_guest_chat', JSON.stringify(pendingChat));
        } catch (e) {}
      }
      
      navigate('/');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isComplete = transmission && fuelType && location;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-12 md:pt-20 px-4 pb-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      <div className="absolute -top-48 -right-48 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md mx-auto relative z-10">
        
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-6 border border-gray-100"
          >
            <Car className="w-8 h-8 text-primary" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black text-gray-900 tracking-tight mb-3"
          >
            Complete Profile
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            To give you hyper-accurate diagnostics, we need 3 quick details {baseVehicle ? `about your ${baseVehicle.year} ${baseVehicle.make} ${baseVehicle.model}` : 'about your vehicle'}.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white"
        >
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3 ml-1">Transmission Type</label>
                <QuickSelect 
                  options={TRANSMISSION_TYPES}
                  value={transmission}
                  onChange={setTransmission}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3 ml-1 mt-4">Fuel Type</label>
                <QuickSelect 
                  options={FUEL_TYPES}
                  value={fuelType}
                  onChange={setFuelType}
                />
              </div>

              <div className="pt-2">
                <AnimatedInput
                  icon={MapPin}
                  label="Location (City, Region)"
                  placeholder="e.g. Chicago, IL"
                  value={location}
                  onChange={(e: any) => setLocation(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={!isComplete || isSubmitting}
                className={`w-full py-3.5 rounded-[20px] flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                  isComplete
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/40' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Complete Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
        
      </div>
    </div>
  );
};

export default CompleteVehicleProfile;
