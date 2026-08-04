import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Car, Settings, Calendar, Activity } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

const GuestIntake = () => {
  const navigate = useNavigate();
  const { setGuestMode } = useAuth();
  const [step, setStep] = useState(0);

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [step]);

  const handleNext = () => {
    if (step === 0 && !make) return;
    if (step === 1 && !model) return;
    if (step === 2 && !year) return;
    
    if (step === 3 && mileage) {
      // Finish and enter guest mode
      setGuestMode(true, {
        id: 'guest-vehicle',
        make,
        model,
        year,
        mileage: parseInt(mileage, 10) || 0,
        type: 'car'
      });
      navigate('/');
    } else {
      setStep(prev => prev + 1);
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
    { label: "Approximate mileage?", value: mileage, setter: setMileage, icon: Activity, placeholder: 'e.g. 45000', type: 'number' }
  ];

  const currentStep = steps[step];

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans relative overflow-hidden bg-transparent">
      
      {/* Header */}
      <div className="p-8 relative z-10">
        <h1 className="text-2xl font-black text-primary tracking-tight cursor-pointer" onClick={() => navigate('/auth')}>Repyr.</h1>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full px-6 relative z-10 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
            className="w-full bg-transparent border-b-2 border-border focus:border-primary text-3xl md:text-4xl text-foreground font-medium pb-4 outline-none transition-colors placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="mt-12 flex justify-between items-center w-full">
          <div className="flex items-center space-x-4 w-32">
            {step > 0 ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep(prev => prev - 1)}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
            ) : <div className="w-14 h-14" />}
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
              disabled={!currentStep.value.trim()}
              className={`flex items-center justify-center w-14 h-14 rounded-full transition-colors ${
                currentStep.value.trim() ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-secondary text-muted-foreground cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestIntake;
