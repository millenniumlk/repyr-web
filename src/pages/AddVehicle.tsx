import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Car, Settings, Calendar, Activity, MapPin, Loader2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

const AddVehicle = () => {
  const navigate = useNavigate();
  const { user, subscriptionTier } = useAuth();
  
  const [step, setStep] = useState(0);

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [transmission, setTransmission] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [location, setLocation] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [step]);

  const handleNext = async () => {
    setErrorMsg('');
    if (step === 0 && !make) return;
    if (step === 1 && !model) return;
    if (step === 2 && !year) return;
    if (step === 3 && !mileage) return;
    if (step === 4 && !transmission) return;
    if (step === 5 && !fuelType) return;
    
    if (step === 6 && location) {
      await handleSaveVehicle();
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handleSaveVehicle = async () => {
    if (!make.trim() || !model.trim() || !year.trim() || !mileage.trim() || !transmission.trim() || !fuelType.trim() || !location.trim()) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!user) throw new Error('Not authenticated');

      const { count: currentVehicles, error: countError } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
        
      if (countError) throw countError;

      const { data: limitData, error: limitError } = await supabase
        .from('plan_limits')
        .select('vehicle_limit')
        .eq('plan_name', subscriptionTier)
        .single();
        
      if (limitError && limitError.code !== 'PGRST116') {
        throw limitError;
      }
      
      const limit = limitData ? limitData.vehicle_limit : -1;
      
      if (limit !== -1 && currentVehicles !== null && currentVehicles >= limit) {
        throw new Error(`Vehicle limit reached. The ${subscriptionTier} plan allows up to ${limit} vehicles. Please upgrade to add more.`);
      }

      const { error } = await supabase.from('vehicles').insert({
        user_id: user.id,
        make: make.trim(),
        model: model.trim(),
        year: parseInt(year.trim(), 10) || 2020,
        mileage: parseInt(mileage.trim(), 10),
        transmission: transmission.trim(),
        fuel_type: fuelType.trim(),
        location: location.trim()
      });

      if (error) throw error;
      
      navigate('/garage');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save vehicle.');
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNext();
    }
  };

  const steps = [
    { label: "What's the make of your vehicle?", value: make, setter: setMake, icon: Car, placeholder: 'e.g. Toyota' },
    { label: "And the model?", value: model, setter: setModel, icon: Settings, placeholder: 'e.g. Camry' },
    { label: "What year was it made?", value: year, setter: setYear, icon: Calendar, placeholder: 'e.g. 2018', type: 'number' },
    { label: "Approximate mileage?", value: mileage, setter: setMileage, icon: Activity, placeholder: 'e.g. 45000', type: 'number' },
    { label: "Transmission type?", value: transmission, setter: setTransmission, icon: Settings, placeholder: 'e.g. Automatic' },
    { label: "Fuel type?", value: fuelType, setter: setFuelType, icon: Activity, placeholder: 'e.g. Petrol' },
    { label: "Where is it located?", value: location, setter: setLocation, icon: MapPin, placeholder: 'e.g. Dubai, UAE' }
  ];

  const currentStep = steps[step];

  return (
    <div className="flex-1 flex flex-col font-sans relative overflow-hidden h-[calc(100vh-5rem)] md:h-auto md:min-h-[600px]">
      
      <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full px-6 relative z-10 pb-20 pt-10">
        
        {/* Back button for layout consistency since mobile header is hidden */}
        <div className="absolute top-0 left-6 right-6 flex justify-between items-center md:hidden">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="font-bold text-foreground">Add Vehicle</span>
            <div className="w-6" />
        </div>

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 mb-6 flex items-center absolute top-16 left-6 right-6 md:static z-20"
          >
            {errorMsg}
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={`label-${step}`}
          className="mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight">
            {currentStep.label}
          </h2>
        </motion.div>

        <div className="relative">
          <input
            ref={inputRef}
            type={currentStep.type || 'text'}
            value={currentStep.value}
            onChange={(e) => currentStep.setter(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentStep.placeholder}
            disabled={isSubmitting}
            className="w-full bg-transparent border-b-2 border-border focus:border-primary text-3xl md:text-4xl text-foreground font-medium pb-4 outline-none transition-colors placeholder:text-muted-foreground/50 disabled:opacity-50"
          />
        </div>

        <div className="mt-12 flex justify-between items-center w-full">
          <div className="flex items-center space-x-4 w-32">
            {step > 0 ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep(prev => prev - 1)}
                disabled={isSubmitting}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
            ) : (
               <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
            )}
          </div>

          <div className="flex space-x-2">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-primary' : i < step ? 'w-2 bg-primary/40' : 'w-2 bg-border'}`} 
              />
            ))}
          </div>

          <div className="flex items-center justify-end w-32">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              disabled={!currentStep.value.trim() || isSubmitting}
              className={`flex items-center justify-center w-14 h-14 rounded-full transition-colors ${
                currentStep.value.trim() && !isSubmitting ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-secondary text-muted-foreground cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              ) : step === steps.length - 1 ? (
                <Check className="w-6 h-6" />
              ) : (
                <ChevronRight className="w-6 h-6" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddVehicle;
