import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, X, CheckCircle, Plus, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useDiagnosticAI } from '../hooks/useDiagnosticAI';
import DiagnosticChat from '../components/DiagnosticChat';
import ChatInputBar from '../components/ChatInputBar';

import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { VEHICLE_CATEGORIES, SUBSCRIPTION_LIMITS } from '../lib/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const Home = () => {
  const navigate = useNavigate();
  const { user, guestVehicle, subscriptionTier } = useAuth();
  
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVehicleSelectorOpen, setIsVehicleSelectorOpen] = useState(false);
  
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

  useEffect(() => {
    let isMounted = true;

    const loadVehicles = async () => {
      if (user) {
        if (isQueryLoading) return; // Wait until react-query completes
        
        let finalData = [...dbVehicles];
        
        // Save pending guest chat vehicle to the database.
        // If needsProfileComplete is true, the user hasn't filled in fuel/transmission/location yet —
        // defer the insert to CompleteVehicleProfile so we don't save an incomplete record.
        const pendingChatRaw = localStorage.getItem('pending_guest_chat');
        if (pendingChatRaw) {
          try {
            const pendingChat = JSON.parse(pendingChatRaw);
            if (pendingChat.vehicle) {
              const gv = pendingChat.vehicle;
              const alreadyExists = finalData.find(v => v.make === gv.make && v.model === gv.model && String(v.year) === String(gv.year));

              if (pendingChat.needsProfileComplete) {
                // Profile not yet completed — surface the vehicle in state for display only,
                // but do NOT insert into the DB. CompleteVehicleProfile will do the insert.
                if (!alreadyExists) {
                  finalData = [{ id: 'pending-vehicle', ...gv }, ...finalData];
                } else {
                  finalData = [alreadyExists, ...finalData.filter(v => v.id !== alreadyExists.id)];
                }
              } else {
                // Profile already complete — safe to insert / reorder.
                if (!alreadyExists) {
                  const { data: newVehicle, error: insertError } = await supabase.from('vehicles').insert({
                    user_id: user.id,
                    make: gv.make,
                    model: gv.model,
                    year: parseInt(gv.year, 10) || 2020,
                    mileage: parseInt(gv.mileage, 10) || 0,
                    transmission: gv.transmission || '',
                    fuel_type: gv.fuel_type || '',
                    location: gv.location || ''
                  }).select().single();

                  if (insertError) {
                    console.error('Failed to save guest vehicle:', insertError);
                  }

                  if (newVehicle) {
                    finalData = [newVehicle, ...finalData];
                    queryClient.invalidateQueries({ queryKey: ['vehicles', user.id] });
                  }
                } else {
                  finalData = [alreadyExists, ...finalData.filter(v => v.id !== alreadyExists.id)];
                }

                delete pendingChat.vehicle;
                if (Object.keys(pendingChat).length === 0) {
                  localStorage.removeItem('pending_guest_chat');
                } else {
                  localStorage.setItem('pending_guest_chat', JSON.stringify(pendingChat));
                }
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
    };

    loadVehicles();

    return () => { isMounted = false; };
  }, [user, guestVehicle, dbVehicles, isQueryLoading, queryClient]);

  // Set selected vehicle once loaded
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(vehicles[0]);
    }
  }, [vehicles, selectedVehicle]);

  // Pre-fill symptoms if there was a pending chat
  useEffect(() => {
    if (!isLoading && vehicles.length === 0) {
      setIsProcessingGuestChat(false);
    }
    
    if (user && !isLoading && selectedVehicle && !isChatActive) {
      const pendingChatRaw = localStorage.getItem('pending_guest_chat');
      if (pendingChatRaw) {
        try {
          const pendingChat = JSON.parse(pendingChatRaw);
          if (pendingChat.symptoms) {
            setInputValue(pendingChat.symptoms);
            setShouldAutoStart(true);
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
  }, [isLoading, selectedVehicle, isChatActive, user]);

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
      
      // If the user is a guest, intercept the chat and show the signup overlay
      if (!user) {
        setIsProcessingGuestChat(false);
        setGuestRedirectMessage(true);
        return;
      }
      
      // NOTE: This client-side limit check is a UX optimization only.
      // The authoritative enforcement happens server-side in the diagnostic-ai edge function,
      // which checks limits BEFORE creating a session. If a user bypasses this client check
      // (e.g., by manipulating subscriptionTier), the edge function will still reject the request.
      let limitReached = false;
      
      if (subscriptionTier !== 'Pro') {
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
          navigate('/settings/subscription');
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
  }, [selectedVehicle, shouldAutoStart, isChatActive, inputValue, category, user, subscriptionTier, navigate, startInvestigation, handleSendReply, resetDiagnosis]);

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
              <EmptyState 
                icon={Car}
                title="Welcome to Repyr"
                description="Add your first vehicle to get started with AI-powered diagnostics and personalized maintenance tracking."
                actionLabel="Add Vehicle"
                onAction={() => navigate('/garage/add')}
              />
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
              hasAccess={hasAccess}
              handleUpgrade={() => navigate('/settings/subscription')}
              isUpgrading={false}
              exitChat={exitChat}
              selectedVehicle={selectedVehicle}
              probabilities={probabilities}
              displayMessages={displayMessages}
              isTyping={isTyping}
              isDiagnosisComplete={isDiagnosisComplete}
              hasAskedFollowUp={hasAskedFollowUp}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      {vehicles.length > 0 && (
        <ChatInputBar 
          isChatActive={isChatActive}
          isTyping={isTyping}
          isDiagnosisComplete={isDiagnosisComplete}
          hasAskedFollowUp={hasAskedFollowUp}
          hasAccess={hasAccess}
          inputValue={inputValue}
          setInputValue={setInputValue}
          selectedVehicle={selectedVehicle}
          openGarage={() => { if (user) setIsVehicleSelectorOpen(true); }}
          category={category}
          handleStartOrReply={handleStartOrReply}
          currentOptions={currentOptions}
          handleSendReply={handleSendReply}
          isGuest={!user}
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
                  const count = parseInt(localStorage.getItem('diagnostics_run_count') || '0', 10);
                  if (count >= 1 && subscriptionTier === 'Trial') {
                    navigate('/settings/subscription');
                  } else {
                    navigate('/garage/add');
                  }
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
