import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Loader2, X, CheckCircle, Plus, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useDiagnosticAI } from '../hooks/useDiagnosticAI';
import DiagnosticChat from '../components/DiagnosticChat';
import ChatInputBar from '../components/ChatInputBar';
import { useToast } from '../lib/ToastContext';

import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { VEHICLE_CATEGORIES, SUBSCRIPTION_LIMITS } from '../lib/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const TimelineInput = ({ label, placeholder, value, onChange, isLast }: any) => (
  <div className="flex gap-4 relative w-full">
    <div className="flex flex-col items-center">
      <div className="w-4 h-4 rounded-full border-[3px] border-border bg-background mt-2 z-10" />
      {!isLast && <div className="w-0.5 bg-border/50 flex-1 my-1" />}
    </div>
    <div className="flex-1 pb-6">
      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full bg-transparent border-b border-border focus:border-primary text-xl font-medium outline-none py-1 transition-colors placeholder:text-muted-foreground/30"
      />
    </div>
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const { isSidebarCollapsed } = useOutletContext<{ isSidebarCollapsed: boolean }>() || { isSidebarCollapsed: false };
  const { user, guestVehicle, subscriptionTier, setGuestMode } = useAuth();
  const { showToast } = useToast();
  
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVehicleSelectorOpen, setIsVehicleSelectorOpen] = useState(false);
  
  const [guestMake, setGuestMake] = useState('');
  const [guestModel, setGuestModel] = useState('');
  const [guestYear, setGuestYear] = useState('');
  const [guestMileage, setGuestMileage] = useState('');

  const [inputValue, setInputValue] = useState('');
  const [category, setCategory] = useState('');
  const [isChatActive, setIsChatActive] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [guestRedirectMessage, setGuestRedirectMessage] = useState(false);
  const [shouldAutoStart, setShouldAutoStart] = useState(false);
  const [isProcessingGuestChat, setIsProcessingGuestChat] = useState(() => {
    const raw = localStorage.getItem('pending_guest_chat');
    if (raw) {
      try {
        const data = JSON.parse(raw);
        return !!data.symptoms;
      } catch (e) {}
    }
    return false;
  });

  const { 
    messages, 
    isTyping, 
    probabilities, 
    startInvestigation, 
    handleSendReply, 
    isDiagnosisComplete, 
    hasAskedFollowUp, 
    currentOptions, 
    resetDiagnosis 
  } = useDiagnosticAI({
    id: selectedVehicle?.id,
    year: selectedVehicle?.year || '',
    make: selectedVehicle?.make || '',
    model: selectedVehicle?.model || '',
    mileage: selectedVehicle?.mileage || '',
    transmission: selectedVehicle?.transmission || '',
    fuel_type: selectedVehicle?.fuel_type || '',
    location: selectedVehicle?.location || '',
    category,
    description: inputValue
  });

  const displayMessages = messages.filter((m: any) => m.role !== 'system' && !(m.role === 'user' && m.content.startsWith('Vehicle:')));

  const queryClient = useQueryClient();

  const { data: dbVehicles = [], isLoading: isQueryLoading } = useQuery({
    queryKey: ['vehicles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      let finalData = data || [];
      return finalData;
    },
    enabled: !!user,
  });

  const hasMigratedGuestVehicle = useRef(false);

  // Separate effect for guest vehicle migration to prevent infinite loops
  useEffect(() => {
    if (!user || isQueryLoading || hasMigratedGuestVehicle.current) return;
    
    const pendingChatRaw = localStorage.getItem('pending_guest_chat');
    if (!pendingChatRaw) {
      hasMigratedGuestVehicle.current = true;
      return;
    }

    try {
      const pendingChat = JSON.parse(pendingChatRaw);
      if (pendingChat.vehicle && !pendingChat.needsProfileComplete) {
        hasMigratedGuestVehicle.current = true;
        
        const gv = pendingChat.vehicle;
        const alreadyExists = dbVehicles.find((v: any) => v.make === gv.make && v.model === gv.model && String(v.year) === String(gv.year));
        
        if (!alreadyExists) {
          supabase.from('vehicles').insert({
            user_id: user.id,
            make: gv.make,
            model: gv.model,
            year: parseInt(gv.year, 10) || 2020,
            mileage: parseInt(gv.mileage, 10) || 0,
            transmission: gv.transmission || '',
            fuel_type: gv.fuel_type || '',
            location: gv.location || ''
          }).then(({ error }) => {
            if (!error) queryClient.invalidateQueries({ queryKey: ['vehicles', user.id] });
          });
        }
        
        delete pendingChat.vehicle;
        if (Object.keys(pendingChat).length === 0) {
          localStorage.removeItem('pending_guest_chat');
        } else {
          localStorage.setItem('pending_guest_chat', JSON.stringify(pendingChat));
        }
      }
    } catch (e) {}
  }, [user, dbVehicles, isQueryLoading, queryClient]);

  // Main vehicle loading effect
  useEffect(() => {
    let isMounted = true;

    if (user) {
      if (isQueryLoading) return;
      let finalData = [...dbVehicles];
      
      const pendingChatRaw = localStorage.getItem('pending_guest_chat');
      if (pendingChatRaw) {
        try {
          const pendingChat = JSON.parse(pendingChatRaw);
          if (pendingChat.vehicle && pendingChat.needsProfileComplete) {
            const gv = pendingChat.vehicle;
            const alreadyExists = finalData.find((v: any) => v.make === gv.make && v.model === gv.model && String(v.year) === String(gv.year));
            if (!alreadyExists) {
              finalData = [{ id: 'pending-vehicle', ...gv }, ...finalData];
            }
          }
        } catch (e) {}
      }
      
      if (isMounted) {
        setVehicles(finalData);
        setIsLoading(false);
      }
    } else {
      let tempVehicles: any[] = [];
      if (guestVehicle) {
        tempVehicles = [guestVehicle];
      }
      const pendingChatRaw = localStorage.getItem('pending_guest_chat');
      if (pendingChatRaw) {
        try {
          const pendingChat = JSON.parse(pendingChatRaw);
          if (pendingChat.vehicle) {
            const vehicle = { id: 'pending-vehicle', ...pendingChat.vehicle };
            if (!tempVehicles.find(v => v.make === vehicle.make && v.model === vehicle.model)) {
              tempVehicles = [vehicle, ...tempVehicles];
            }
          }
        } catch (e) {}
      }
      if (isMounted) {
        setVehicles(tempVehicles);
        setIsLoading(false);
      }
    }

    return () => { isMounted = false; };
  }, [user, guestVehicle, dbVehicles, isQueryLoading]);

  // Set selected vehicle once loaded
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(vehicles[0]);
    }
  }, [vehicles, selectedVehicle]);

  // Reset diagnosis and state when selected vehicle changes
  useEffect(() => {
    resetDiagnosis();
    setCategory('');
    setInputValue('');
    setIsChatActive(false);
  }, [selectedVehicle?.id, resetDiagnosis]);

  // Pre-fill symptoms if there was a pending chat
  useEffect(() => {
    if (!isLoading && vehicles.length === 0) {
      setIsProcessingGuestChat(false);
    }
    
    if (!isLoading && !isChatActive) {
      const pendingChatRaw = localStorage.getItem('pending_guest_chat');
      if (pendingChatRaw) {
        try {
          const pendingChat = JSON.parse(pendingChatRaw);
          
          if (user && selectedVehicle && pendingChat.needsProfileComplete) {
            navigate('/diagnose/complete-profile');
            return;
          }
          
          if (pendingChat.symptoms) {
            setInputValue(pendingChat.symptoms);
            // Only auto-start if they have a vehicle (either user or guest with vehicle)
            if (selectedVehicle) {
              setShouldAutoStart(true);
            }
            
            delete pendingChat.symptoms;
            if (Object.keys(pendingChat).length === 0) {
              localStorage.removeItem('pending_guest_chat');
            } else {
              localStorage.setItem('pending_guest_chat', JSON.stringify(pendingChat));
            }
          }
        } catch (e) {}
      }
    }
  }, [isLoading, selectedVehicle, isChatActive, user, navigate]);

  // Hide global mobile header when chat is active (CSS class toggle)
  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;

    if (isChatActive) {
      header.classList.add('header-hidden');
    } else {
      header.classList.remove('header-hidden');
    }

    return () => {
      header?.classList.remove('header-hidden');
    };
  }, [isChatActive]);



  const handleStartOrReply = useCallback(async () => { // 🔴 Bug fix: useCallback prevents stale closure in the auto-start effect
    if (!selectedVehicle) {
      if (!user) {
        if (!guestMake || !guestModel || !guestYear) {
          showToast('Please fill in your vehicle Year, Make, and Model to continue.', 'error');
          return;
        }

        setGuestMode(true, {
          id: 'guest-vehicle',
          make: guestMake,
          model: guestModel,
          year: guestYear,
          mileage: parseInt(guestMileage, 10) || 0
        } as any);
        setShouldAutoStart(true);
        return;
      }
      setIsProcessingGuestChat(false);
      return;
    }

    if (shouldAutoStart) {
      setShouldAutoStart(false);
    }

    if (!isChatActive) {
      if (!inputValue.trim() && !category) {
        setIsProcessingGuestChat(false);
        return;
      }
      
      // We removed the guest signup intercept overlay so guests can chat freely
      
      // NOTE: This client-side limit check is a UX optimization only.
      // The authoritative enforcement happens server-side in the diagnostic-ai edge function,
      // which checks limits BEFORE creating a session. If a user bypasses this client check
      // (e.g., by manipulating subscriptionTier), the edge function will still reject the request.
      let limitReached = false;
      
      if (!user) {
        // Guest limit check
        const todayDateString = new Date().toISOString().split('T')[0];
        const guestUsageRaw = localStorage.getItem('guest_usage');
        let guestUsage = { date: todayDateString, count: 0 };
        
        if (guestUsageRaw) {
          try {
            const parsed = JSON.parse(guestUsageRaw);
            if (parsed.date === todayDateString) {
              guestUsage = parsed;
            }
          } catch (e) {}
        }
        
        if (guestUsage.count >= 3) {
          showToast('You have reached the daily limit of 3 free diagnostics.', 'error');
          setIsProcessingGuestChat(false);
          return; // Stop guest completely
        }
        
        // Increment usage
        guestUsage.count += 1;
        localStorage.setItem('guest_usage', JSON.stringify(guestUsage));

      } else if (subscriptionTier !== 'Pro') {
        // Authenticated user limit check
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { count, error } = await supabase
          .from('diagnostic_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', twentyFourHoursAgo);

        if (error) {
          console.error("Error checking limits manually:", error);
          limitReached = true;
        } else {
          let adjustedCount = count || 0;
          
          if (subscriptionTier === 'Plus') {
            const { data: firstSession } = await supabase
              .from('diagnostic_sessions')
              .select('created_at')
              .eq('user_id', user.id)
              .order('created_at', { ascending: true })
              .limit(1)
              .single();

            if (firstSession && new Date(firstSession.created_at) >= new Date(twentyFourHoursAgo)) {
              adjustedCount = Math.max(0, adjustedCount - 1);
            }
          }

          const maxSessions = subscriptionTier === 'Plus' ? SUBSCRIPTION_LIMITS.PLUS_MAX_SESSIONS : SUBSCRIPTION_LIMITS.TRIAL_MAX_SESSIONS;
          if (adjustedCount >= maxSessions) {
            limitReached = true;
          }
        }
      }
      
      if (limitReached) {
        if (subscriptionTier === 'Trial') {
          setIsProcessingGuestChat(false);
          navigate('/diagnose/settings/subscription');
          return;
        } else {
          setIsChatActive(true);
          setInputValue('');
          setHasAccess(false);
          setIsProcessingGuestChat(false);
        }
      } else {
        setIsChatActive(true);
        setInputValue('');
        setHasAccess(true);
        startInvestigation();
        setIsProcessingGuestChat(false);
      }
    } else {
      if (!inputValue.trim()) return;
      handleSendReply(inputValue);
      setInputValue('');
    }
  }, [selectedVehicle, shouldAutoStart, isChatActive, inputValue, category, user, subscriptionTier, navigate, startInvestigation, handleSendReply, resetDiagnosis, guestMake, guestModel, guestYear, guestMileage, setGuestMode, showToast]);

  useEffect(() => {
    if (shouldAutoStart && (inputValue || category)) {
      handleStartOrReply();
    }
  }, [shouldAutoStart, inputValue, category, handleStartOrReply]); // 🔴 Bug fix: handleStartOrReply now in deps

  const exitChat = useCallback(() => {
    setIsChatActive(false);
    setInputValue('');
    setCategory('');
    setHasAccess(null);
    resetDiagnosis();
  }, [resetDiagnosis]);

  if (isLoading || isProcessingGuestChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4 w-full max-w-2xl mx-auto">
        <Skeleton className="w-full h-[60px] rounded-2xl" />
        <Skeleton className="w-full h-[120px] rounded-2xl" />
        <Skeleton className="w-3/4 h-[40px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      
      {/* Dynamic Content Area */}
      <AnimatePresence mode="wait">
        {!isChatActive ? (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col justify-center pb-32"
          >
            {vehicles.length === 0 ? (
              user ? (
                <EmptyState 
                  icon={Car}
                  title="Welcome to Repyr"
                  description="Add your first vehicle to get started with AI-powered diagnostics and personalized maintenance tracking."
                  actionLabel="Add Vehicle"
                  onAction={() => navigate('/diagnose/garage/add')}
                />
              ) : (
                <div className="mt-8 flex flex-col items-start justify-start text-left max-w-2xl mx-auto px-6 w-full">
                  <div className="mb-10 w-full">
                    <h1 className="text-3xl md:text-4xl font-normal text-foreground tracking-tight leading-tight mb-8">
                      Let's fix your car.
                    </h1>
                    
                    <div className="flex flex-col ml-2">
                      <TimelineInput label="YEAR" placeholder="e.g. 2018" value={guestYear} onChange={(e: any) => setGuestYear(e.target.value)} />
                      <TimelineInput label="MAKE" placeholder="e.g. Toyota" value={guestMake} onChange={(e: any) => setGuestMake(e.target.value)} />
                      <TimelineInput label="MODEL" placeholder="e.g. Camry" value={guestModel} onChange={(e: any) => setGuestModel(e.target.value)} />
                      <TimelineInput label="MILEAGE" placeholder="e.g. 45000 (Optional)" value={guestMileage} onChange={(e: any) => setGuestMileage(e.target.value)} isLast={true} />
                    </div>
                  </div>
                  
                  {/* Common Issue Prompts */}
                  <div className="flex flex-wrap justify-start gap-3 w-full">
                    {VEHICLE_CATEGORIES.map((cat, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="chip"
                        onClick={() => setCategory(category === cat ? '' : cat)}
                        className={category === cat
                          ? 'border-primary/20 text-primary shadow-glow-primary bg-primary/5'
                          : 'border-border text-muted-foreground shadow-sm bg-card hover:border-border'
                        }
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>
              )
            ) : (
              <div className="mt-8 flex flex-col items-start justify-start text-left max-w-2xl mx-auto px-6 w-full">
                <div className="mb-6 w-full">
                  <h1 className="text-2xl md:text-3xl font-normal text-primary tracking-tight leading-tight">
                    Let's fix your {selectedVehicle?.model || 'vehicle'}.
                  </h1>
                </div>
                
                {/* Common Issue Prompts */}
                <div className="flex flex-wrap justify-start gap-3 w-full">
                  {VEHICLE_CATEGORIES.map((cat, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="chip"
                      onClick={() => setCategory(category === cat ? '' : cat)}
                      className={category === cat
                        ? 'border-primary/20 text-primary shadow-glow-primary'
                        : 'border-transparent text-muted-foreground shadow-soft-card'
                      }
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="chat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            <DiagnosticChat 
              hasAccess={hasAccess ?? undefined}
              handleUpgrade={() => navigate('/diagnose/settings/subscription')}
              isUpgrading={false}
              exitChat={exitChat}
              probabilities={probabilities}
              displayMessages={displayMessages}
              isTyping={isTyping}
              isDiagnosisComplete={isDiagnosisComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      {(vehicles.length > 0 || !user) && (
        <ChatInputBar 
          isChatActive={isChatActive}
          isTyping={isTyping}
          isDiagnosisComplete={isDiagnosisComplete}
          hasAskedFollowUp={hasAskedFollowUp}
          hasAccess={hasAccess ?? undefined}
          inputValue={inputValue}
          setInputValue={setInputValue}
          selectedVehicle={selectedVehicle}
          openGarage={() => { if (user) setIsVehicleSelectorOpen(true); }}
          category={category}
          handleStartOrReply={handleStartOrReply}
          currentOptions={currentOptions}
          handleSendReply={handleSendReply}
          isGuest={!user}
          isSidebarCollapsed={isSidebarCollapsed}
        />
      )}

      {/* Vehicle Selector Modal */}
      <AnimatePresence>
        {isVehicleSelectorOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsVehicleSelectorOpen(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-3xl p-6 w-full max-w-sm shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Select Vehicle</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsVehicleSelectorOpen(false)} className="h-9 w-9 -mr-2">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar">
                {vehicles.map(v => (
                  <Button 
                    key={v.id}
                    variant="ghost"
                    onClick={() => {
                      setSelectedVehicle(v);
                      setIsVehicleSelectorOpen(false);
                      setCategory('');
                      setInputValue('');
                      setIsChatActive(false);
                      resetDiagnosis();
                    }}
                    className={`w-full h-auto text-left px-4 py-3 rounded-full flex items-center justify-between font-normal ${
                      selectedVehicle?.id === v.id 
                        ? 'bg-primary/10 text-primary border-primary/20 border' 
                        : 'bg-secondary/50 hover:bg-secondary border-transparent text-foreground'
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-medium text-base tracking-tight">{v.year} {v.make} {v.model}</p>
                      {v.vin && <p className="text-xs opacity-70 font-mono mt-0.5">{v.vin}</p>}
                    </div>
                    {selectedVehicle?.id === v.id && <CheckCircle className="w-5 h-5 text-primary" />}
                  </Button>
                ))}
              </div>
              <Button 
                variant="outline"
                onClick={() => {
                  setIsVehicleSelectorOpen(false);
                  navigate('/diagnose/garage/add');
                }}
                className="w-full mt-4 rounded-full border-dashed border-primary/40 text-primary hover:bg-primary/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Vehicle
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guest Redirect Overlay */}
      <AnimatePresence>
        {guestRedirectMessage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-card rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border border-border"
            >
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-3 tracking-tight">Analyzing Symptoms...</h3>
              <p className="text-muted-foreground font-medium text-[15px] leading-relaxed mb-8">
                Sign up to complete the chat and view your diagnosis.
              </p>
              <Button
                onClick={() => {
                  const pendingChat = {
                    vehicle: selectedVehicle,
                    symptoms: inputValue.trim() || category,
                    needsProfileComplete: true
                  };
                  localStorage.setItem('pending_guest_chat', JSON.stringify(pendingChat));
                  setGuestRedirectMessage(false);
                  window.location.href = '/auth?signup=true&fromGuestChat=true';
                }}
                className="w-full font-normal"
              >
                Sign Up to Continue
              </Button>
              <Button
                variant="ghost"
                onClick={() => setGuestRedirectMessage(false)}
                className="w-full mt-3 font-normal"
              >
                Cancel
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
