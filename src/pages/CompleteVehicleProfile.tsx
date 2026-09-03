import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { sanitizeInput } from '../lib/utils';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';

const TRANSMISSION_TYPES = ['Automatic', 'Manual', 'Tiptronic'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric'];

const QuickSelect = ({ options, value, onChange }: { options: string[], value: string, onChange: (v: string) => void }) => (
  <div className="flex flex-wrap gap-2 mb-1">
    {options.map((opt) => (
      <Button
        key={opt}
        type="button"
        variant="outline"
        onClick={() => onChange(value === opt ? '' : opt)}
        className={`h-auto px-3 py-2 rounded-xl text-sm transition-all duration-200 font-medium ${
          value === opt 
            ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 scale-[0.98] hover:bg-primary/90 hover:text-white' 
            : 'bg-card border-border text-muted-foreground hover:bg-muted hover:border-gray-300'
        }`}
      >
        {opt}
      </Button>
    ))}
  </div>
);

const AnimatedInput = ({ icon: Icon, label, ...props }: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = props.value !== undefined && props.value.toString().length > 0;
  
  return (
    <div className="mb-2 relative">
      <div 
        className={`relative flex items-center bg-card rounded-xl transition-all duration-300 ${
          isFocused 
            ? 'border-primary ring-4 ring-primary/20 shadow-lg shadow-primary/10' 
            : 'border-border border'
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
                  ? 'text-[11px] -translate-y-2.5 font-bold text-primary tracking-wider uppercase' 
                  : 'text-[15px] text-muted-foreground translate-y-0'
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
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [transmission, setTransmission] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [baseVehicle, setBaseVehicle] = useState<any>(null);

  useEffect(() => {
    // Try to find the vehicle to complete.
    // Priority 1: the vehicle stored in pending_guest_chat local storage.
    // Priority 2: the most recently added vehicle in Supabase without fuel/transmission details.
    const loadVehicle = async () => {
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

      // Fallback: most recently added vehicle from Supabase
      if (user) {
        const { data } = await supabase
          .from('vehicles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
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
      // Check if this vehicle already exists in Supabase (inserted by a previous step)
      // so we update rather than insert a duplicate.
      let existingId: string | null = null;

      if (baseVehicle?.id && baseVehicle.id !== 'guest-vehicle' && baseVehicle.id !== 'pending-vehicle') {
        // Already has a real Supabase UUID
        existingId = baseVehicle.id;
      } else if (baseVehicle) {
        // Lookup by make/model/year in case Home.tsx inserted it earlier
        const { data: found } = await supabase
          .from('vehicles')
          .select('id')
          .eq('user_id', user.id)
          .eq('make', baseVehicle.make)
          .eq('model', baseVehicle.model)
          .eq('year', parseInt(String(baseVehicle.year), 10) || 0)
          .limit(1)
          .maybeSingle();

        if (found) existingId = found.id;
      }

      if (existingId) {
        // Update the existing row with the completed details
        await supabase
          .from('vehicles')
          .update({ 
            transmission: sanitizeInput(transmission), 
            fuel_type: sanitizeInput(fuelType), 
            location: sanitizeInput(location) 
          })
          .eq('id', existingId);
      } else if (baseVehicle) {
        // Vehicle isn't in the DB yet — insert with all fields at once
        await supabase.from('vehicles').insert([{
          user_id: user.id,
          make: sanitizeInput(baseVehicle.make),
          model: sanitizeInput(baseVehicle.model),
          year: parseInt(sanitizeInput(String(baseVehicle.year)), 10) || 2020,
          mileage: parseInt(sanitizeInput(String(baseVehicle.mileage)), 10) || 0,
          transmission: sanitizeInput(transmission),
          fuel_type: sanitizeInput(fuelType),
          location: sanitizeInput(location)
        }]);
      }

      // Remove the needsProfileComplete flag so Home.tsx knows the vehicle is ready,
      // but keep the symptoms so the chat auto-starts.
      const pendingChatRaw = localStorage.getItem('pending_guest_chat');
      if (pendingChatRaw) {
        try {
          const pendingChat = JSON.parse(pendingChatRaw);
          delete pendingChat.needsProfileComplete;
          delete pendingChat.vehicle; // vehicle is now saved in Supabase
          if (Object.keys(pendingChat).length === 0) {
            localStorage.removeItem('pending_guest_chat');
          } else {
            localStorage.setItem('pending_guest_chat', JSON.stringify(pendingChat));
          }
        } catch (e) {}
      }

      await queryClient.invalidateQueries({ queryKey: ['vehicles', user.id] });

      navigate('/diagnose');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isComplete = transmission && fuelType && location;

  return (
    <div className="flex flex-col justify-center min-h-[80vh] px-4 py-4 relative">
      <div className="w-full max-w-md mx-auto relative z-10">
        
        <div className="text-center mb-6">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-black text-foreground tracking-tight mb-2"
          >
            Complete Profile
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-base"
          >
            To give you hyper-accurate diagnostics, we need 3 quick details {baseVehicle ? `about your ${baseVehicle.year} ${baseVehicle.make} ${baseVehicle.model}` : 'about your vehicle'}.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full"
        >
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              
              <div>
                <label className="block text-sm font-bold text-foreground mb-2 ml-1">Transmission Type</label>
                <QuickSelect 
                  options={TRANSMISSION_TYPES}
                  value={transmission}
                  onChange={setTransmission}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2 ml-1">Fuel Type</label>
                <QuickSelect 
                  options={FUEL_TYPES}
                  value={fuelType}
                  onChange={setFuelType}
                />
              </div>

              <div className="pt-1">
                <AnimatedInput
                  icon={MapPin}
                  label="Location (City, Region)"
                  placeholder="e.g. Chicago, IL"
                  value={location}
                  onChange={(e: any) => setLocation(e.target.value)}
                  maxLength={50}
                  required
                />
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="submit"
                disabled={!isComplete || isSubmitting}
                isLoading={isSubmitting}
                className="w-full"
              >
                Complete Profile
              </Button>
            </div>
          </form>
        </motion.div>
        
      </div>
    </div>
  );
};

export default CompleteVehicleProfile;
