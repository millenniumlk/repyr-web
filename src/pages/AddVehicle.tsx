import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, Car, Calendar, Gauge, MapPin, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const POPULAR_MAKES = ['Toyota', 'Nissan', 'Honda', 'BMW', 'Mercedes', 'Ford'];
const POPULAR_MODELS: Record<string, string[]> = {
  'Toyota': ['Land Cruiser', 'Patrol', 'Camry', 'Corolla', 'Hilux', 'Prado'],
  'Nissan': ['Patrol', 'Sunny', 'Altima', 'Maxima', 'Pathfinder'],
  'Honda': ['Accord', 'Civic', 'CR-V', 'HR-V'],
  'BMW': ['X5', 'X6', '3 Series', '5 Series'],
  'Mercedes': ['G-Class', 'C-Class', 'E-Class', 'S-Class'],
  'Ford': ['Mustang', 'Explorer', 'F-150', 'Edge']
};
const TRANSMISSION_TYPES = ['Automatic', 'Manual', 'Tiptronic'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric'];

const TOTAL_STEPS = 3;

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

const AddVehicle = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [transmission, setTransmission] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const nextStep = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!make.trim() || !model.trim()) {
        setErrorMsg('Please enter both Make and Model.');
        return;
      }
    } else if (step === 2) {
      if (!year.trim() || !mileage.trim()) {
        setErrorMsg('Please enter both Year and Mileage.');
        return;
      }
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSaveVehicle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    
    if (!make.trim() || !model.trim() || !year.trim() || !mileage.trim() || !transmission.trim() || !fuelType.trim() || !location.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!user) throw new Error('Not authenticated');

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 px-4 md:px-0">
      <div className="flex items-center justify-between mb-8 pt-2 px-1">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => step === 1 ? navigate(-1) : prevStep()}
            className="p-2 hover:bg-secondary rounded-full transition-colors bg-white shadow-sm border border-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Add Vehicle</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Step {step} of {TOTAL_STEPS}</p>
          </div>
        </div>
        
        {/* Progress Dots */}
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-primary' : 'w-2 bg-gray-200'
              }`} 
            />
          ))}
        </div>
      </div>

      <div className="glass rounded-3xl p-5 md:p-10 shadow-sm border border-white/60 min-h-[450px] flex flex-col relative overflow-hidden">
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 mb-6 flex items-center"
          >
            {errorMsg}
          </motion.div>
        )}

        <div className="flex-1 relative">
          <AnimatePresence mode="wait" custom={1}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full"
              >
                
                <AnimatedInput 
                  icon={Car} 
                  label="Vehicle Make"
                  value={make}
                  onChange={(e: any) => {
                    const val = e.target.value;
                    setMake(val);
                    if (POPULAR_MODELS[val] && !POPULAR_MODELS[val].includes(model)) setModel('');
                  }}
                  placeholder="e.g. Toyota"
                />
                <QuickSelect 
                  options={POPULAR_MAKES} 
                  value={make} 
                  onChange={(val) => {
                    setMake(val);
                    setModel('');
                  }} 
                />

                <div className="mt-8">
                  <AnimatedInput 
                    icon={Car} 
                    label="Model"
                    value={model}
                    onChange={(e: any) => setModel(e.target.value)}
                    placeholder="e.g. Land Cruiser"
                  />
                  {POPULAR_MODELS[make] && (
                    <QuickSelect 
                      options={POPULAR_MODELS[make]} 
                      value={model} 
                      onChange={setModel} 
                    />
                  )}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full"
              >

                <AnimatedInput 
                  icon={Calendar} 
                  label="Year"
                  type="number"
                  value={year}
                  onChange={(e: any) => setYear(e.target.value)}
                  placeholder="e.g. 2022"
                />

                <div className="mt-8">
                  <AnimatedInput 
                    icon={Gauge} 
                    label="Current Mileage (KM)"
                    type="number"
                    value={mileage}
                    onChange={(e: any) => setMileage(e.target.value)}
                    placeholder="e.g. 145000"
                  />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full"
              >

                <div className="mb-8">
                  <QuickSelect options={TRANSMISSION_TYPES} value={transmission} onChange={setTransmission} />
                </div>

                <div className="mb-8">
                  <QuickSelect options={FUEL_TYPES} value={fuelType} onChange={setFuelType} />
                </div>

                <AnimatedInput 
                  icon={MapPin} 
                  label="Location"
                  value={location}
                  onChange={(e: any) => setLocation(e.target.value)}
                  placeholder="e.g. Dubai, UAE"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Wizard Footer Controls */}
        <div className="pt-8 mt-6 border-t border-gray-100 flex gap-4">
          {step < TOTAL_STEPS ? (
            <button 
              onClick={nextStep}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
            >
              <span>Continue</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={handleSaveVehicle}
              disabled={isSubmitting}
              className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Save to Garage</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddVehicle;
