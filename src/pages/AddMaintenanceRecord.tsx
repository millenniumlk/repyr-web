import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Wrench, Calendar, Activity, DollarSign, FileText, Camera, Loader2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../lib/ToastContext';
import { sanitizeInput } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SERVICE_TYPES } from '../lib/constants';

const AddMaintenanceRecord = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({
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
  
  const [step, setStep] = useState(0);

  const [vehicleId, setVehicleId] = useState('');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceType, setServiceType] = useState('');
  const [cost, setCost] = useState('');
  const [mileage, setMileage] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [step]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 3 - photos.length); // Max 3 photos
      setPhotos(prev => [...prev, ...newFiles]);
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPhotoPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index]);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleNext = async () => {
    setErrorMsg('');
    if (step === 0 && !vehicleId) return;
    if (step === 1 && !serviceDate) return;
    if (step === 2 && !serviceType) return;
    if (step === 3 && !cost) return;
    if (step === 4 && !mileage) return;
    if (step === 5 && !description) return;
    
    if (step === 6) {
      await handleSaveRecord();
      return;
    }

    setStep(prev => prev + 1);
  };

  const handleSaveRecord = async () => {
    if (!vehicleId || !serviceDate || !serviceType) {
      setErrorMsg('Please fill in required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!user) throw new Error('Not authenticated');

      // 1. Insert record
      const { data: record, error: insertError } = await supabase.from('maintenance_records').insert({
        user_id: user.id,
        vehicle_id: vehicleId,
        service_date: serviceDate,
        service_type: sanitizeInput(serviceType),
        cost: cost ? parseFloat(sanitizeInput(cost)) : null,
        mileage: mileage ? parseInt(sanitizeInput(mileage), 10) : null,
        description: sanitizeInput(description),
        photo_urls: [] // initially empty
      }).select().single();

      if (insertError) throw insertError;
      if (!record) throw new Error('Failed to create record');

      // 2. Upload photos if any
      const uploadedUrls: string[] = [];
      if (photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          const file = photos[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${i}.${fileExt}`;
          const filePath = `${user.id}/${record.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('maintenance-photos')
            .upload(filePath, file);
            
          if (uploadError) {
            console.error('Upload error:', uploadError);
            continue; // Skip failed uploads
          }
          
          const { data: publicUrlData } = supabase.storage
            .from('maintenance-photos')
            .getPublicUrl(filePath);
            
          if (publicUrlData.publicUrl) {
            uploadedUrls.push(publicUrlData.publicUrl);
          }
        }

        // 3. Update record with photo URLs
        if (uploadedUrls.length > 0) {
          const { error: updateError } = await supabase
            .from('maintenance_records')
            .update({ photo_urls: uploadedUrls })
            .eq('id', record.id);
            
          if (updateError) throw updateError;
        }
      }
      
      await queryClient.invalidateQueries({ queryKey: ['maintenance_records', user.id] });
      showToast('Record saved successfully', 'success');
      navigate('/diagnose/maintenance');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save record.');
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step !== 5) { // allow enter in textarea
      handleNext();
    }
  };

  const vehicleOptions = vehicles.map(v => ({
    value: v.id,
    label: `${v.year} ${v.make} ${v.model}`
  }));

  const steps = [
    { label: "Which vehicle?", value: vehicleId, setter: setVehicleId, icon: Wrench, options: vehicleOptions },
    { label: "Date of service", value: serviceDate, setter: setServiceDate, icon: Calendar, type: 'date' },
    { label: "Type of service", value: serviceType, setter: setServiceType, icon: Wrench, options: SERVICE_TYPES.map(s => ({ value: s, label: s })) },
    { label: "Cost ($)", value: cost, setter: setCost, icon: DollarSign, type: 'number', placeholder: 'e.g. 150.00' },
    { label: "Mileage at service", value: mileage, setter: setMileage, icon: Activity, type: 'number', placeholder: 'e.g. 45000' },
    { label: "Notes / Description", value: description, setter: setDescription, icon: FileText, type: 'textarea', placeholder: 'e.g. Changed oil and rotated tires' },
    { label: "Upload Receipts/Photos", value: '', setter: () => {}, icon: Camera, type: 'file' }
  ];

  const currentStep = steps[step];

  if (isLoadingVehicles) {
    return (
      <div className="flex-1 flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col font-sans relative overflow-hidden h-[calc(100vh-5rem)] md:h-auto md:min-h-[600px]">
      
      <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full px-6 relative z-10 pb-20 pt-10">
        
        <div className="absolute top-0 left-6 right-6 flex justify-between items-center md:hidden">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2 text-muted-foreground">
                <ChevronLeft className="w-6 h-6" />
            </Button>
            <span className="font-bold text-foreground">Add Record</span>
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
          {currentStep.options ? (
            <div className="relative w-full">
              <select
                ref={inputRef as any}
                value={currentStep.value}
                onChange={(e) => currentStep.setter(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-transparent border-b-2 border-border focus:border-primary text-3xl md:text-4xl text-foreground font-medium pb-4 outline-none transition-colors disabled:opacity-50 appearance-none cursor-pointer"
              >
                <option value="" disabled className="text-lg text-muted-foreground">Select option...</option>
                {currentStep.options.map((opt: any) => (
                  <option key={opt.value} value={opt.value} className="text-lg text-foreground">{opt.label}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none pb-4 opacity-50">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          ) : currentStep.type === 'textarea' ? (
            <textarea
              ref={inputRef as any}
              value={currentStep.value}
              onChange={(e) => currentStep.setter(e.target.value)}
              placeholder={currentStep.placeholder}
              disabled={isSubmitting}
              className="w-full bg-transparent border-b-2 border-border focus:border-primary text-2xl md:text-3xl text-foreground font-medium pb-4 outline-none transition-colors placeholder:text-muted-foreground/50 disabled:opacity-50 resize-none min-h-[120px]"
            />
          ) : currentStep.type === 'file' ? (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                accept="image/*"
                multiple
                className="hidden"
                disabled={isSubmitting || photos.length >= 3}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || photos.length >= 3}
                className="w-full h-16 text-lg border-dashed border-2"
              >
                <Camera className="w-5 h-5 mr-2" />
                Select Photos (Max 3)
              </Button>
              
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {photoPreviews.map((preview, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border">
                      <img src={preview} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removePhoto(idx)}
                        disabled={isSubmitting}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <input
              ref={inputRef as any}
              type={currentStep.type === 'number' ? 'text' : (currentStep.type || 'text')}
              inputMode={currentStep.type === 'number' ? (currentStep.label.includes('Cost') ? 'decimal' : 'numeric') : undefined}
              value={currentStep.value}
              onChange={(e) => {
                let val = e.target.value;
                if (currentStep.type === 'number') {
                  if (currentStep.label.includes('Cost')) {
                     val = val.replace(/[^0-9.]/g, ''); // allow decimals
                  } else {
                     val = val.replace(/\D/g, '');
                  }
                }
                const maxLen = 50;
                if (val.length > maxLen) {
                  val = val.slice(0, maxLen);
                }
                currentStep.setter(val);
              }}
              onKeyDown={handleKeyDown}
              placeholder={currentStep.placeholder}
              disabled={isSubmitting}
              className="w-full bg-transparent border-b-2 border-border focus:border-primary text-3xl md:text-4xl text-foreground font-medium pb-4 outline-none transition-colors placeholder:text-muted-foreground/50 disabled:opacity-50"
            />
          )}
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
              disabled={
                isSubmitting || 
                (step === 0 && !vehicleId) ||
                (step === 1 && !serviceDate) ||
                (step === 2 && !serviceType)
              }
              className={`flex items-center justify-center w-14 h-14 rounded-full transition-colors ${
                (currentStep.type === 'file' || currentStep.type === 'textarea' || currentStep.value.trim() || currentStep.type === 'date') && !isSubmitting 
                  ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                  : 'bg-secondary text-muted-foreground cursor-not-allowed'
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

export default AddMaintenanceRecord;
