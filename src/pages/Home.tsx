import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Loader2, X, CheckCircle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useDiagnosticAI } from '../hooks/useDiagnosticAI';
import DiagnosticChat from '../components/DiagnosticChat';
import ChatInputBar from '../components/ChatInputBar';

const VEHICLE_CATEGORIES = [
  "Car won't start", "Engine overheating", "Check engine light", 
  "Battery problem", "Strange noise", "Poor acceleration", 
  "Transmission problem", "Other"
];

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

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    let tempVehicles: any[] = [];
    
    if (user) {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id);
        
      if (!error && data) {
        let finalData = data;
        
        // Remove backend-injected default Toyota Camry to show empty state
        if (data.length === 1 && data[0].make === 'Toyota' && data[0].model === 'Camry' && !data[0].transmission) {
          supabase.from('vehicles').delete().eq('id', data[0].id).then();
          finalData = [];
        }
        
        // Save pending guest chat vehicle to the database
        const pendingChatRaw = localStorage.getItem('pending_guest_chat');
        if (pendingChatRaw) {
          try {
            const pendingChat = JSON.parse(pendingChatRaw);
            if (pendingChat.vehicle) {
              const gv = pendingChat.vehicle;
              const alreadyExists = finalData.find(v => v.make === gv.make && v.model === gv.model && String(v.year) === String(gv.year));
              
              if (!alreadyExists) {
                const { data: newVehicle } = await supabase.from('vehicles').insert({
                  user_id: user.id,
                  make: gv.make,
                  model: gv.model,
                  year: gv.year,
                  transmission: gv.transmission || '',
                  engine: gv.engine || '',
                  drivetrain: gv.drivetrain || '',
                  fuel_type: gv.fuel_type || '',
                  location: gv.location || ''
                }).select().single();
                
                if (newVehicle) {
                  finalData = [newVehicle, ...finalData];
                }
              }
              
              // Remove vehicle from pending chat so we don't save it again on next refresh
              delete pendingChat.vehicle;
              if (Object.keys(pendingChat).length === 0) {
                localStorage.removeItem('pending_guest_chat');
              } else {
                localStorage.setItem('pending_guest_chat', JSON.stringify(pendingChat));
              }
            }
          } catch (e) {}
        }
        
        tempVehicles = finalData;
      }
    } else {
      if (guestVehicle) {
        tempVehicles = [guestVehicle];
      }
      
      // Check pending guest chat for guest users
      const pendingChatRaw = localStorage.getItem('pending_guest_chat');
      if (pendingChatRaw) {
        try {
          const pendingChat = JSON.parse(pendingChatRaw);
          if (pendingChat.vehicle) {
            const vehicle = { id: 'pending-vehicle', ...pendingChat.vehicle };
            // If not already in the list, add it
            if (!tempVehicles.find(v => v.make === vehicle.make && v.model === vehicle.model)) {
              tempVehicles = [vehicle, ...tempVehicles];
            }
          }
        } catch (e) {}
      }
    }

    setVehicles(tempVehicles);
    if (tempVehicles.length > 0) setSelectedVehicle(tempVehicles[0]);
    setIsLoading(false);
  }, [user, guestVehicle]);

  // Pre-fill symptoms if there was a pending chat
  useEffect(() => {
    if (!isLoading && selectedVehicle && !isChatActive) {
      const pendingChatRaw = localStorage.getItem('pending_guest_chat');
      if (pendingChatRaw) {
        try {
          const pendingChat = JSON.parse(pendingChatRaw);
          if (pendingChat.symptoms) {
            setInputValue(pendingChat.symptoms);
            setShouldAutoStart(true);
            // Clean up only the symptoms so it doesn't trigger again, but keep the vehicle!
            delete pendingChat.symptoms;
            localStorage.setItem('pending_guest_chat', JSON.stringify(pendingChat));
          }
        } catch (e) {}
      }
    }
  }, [isLoading, selectedVehicle, isChatActive]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Hide global mobile header on scroll down when chat is active
  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;

    header.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

    if (!isChatActive) {
      header.style.opacity = '1';
      header.style.transform = 'translateY(0)';
      header.style.pointerEvents = 'auto';
      return;
    }

    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        header.style.opacity = '0';
        header.style.transform = 'translateY(-100%)';
        header.style.pointerEvents = 'none';
      } else if (currentScrollY < lastScrollY) {
        header.style.opacity = '1';
        header.style.transform = 'translateY(0)';
        header.style.pointerEvents = 'auto';
      }
      
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (header) {
        header.style.opacity = '1';
        header.style.transform = 'translateY(0)';
        header.style.pointerEvents = 'auto';
      }
    };
  }, [isChatActive]);


  const handleStartOrReply = async () => {
    if (!selectedVehicle) return;

    if (shouldAutoStart) {
      setShouldAutoStart(false);
    }

    if (!isChatActive) {
      if (!inputValue.trim() && !category) return;
      
      // If the user is a guest, intercept the chat and force auth
      if (!user) {
        setGuestRedirectMessage(true);
        // We no longer auto-redirect. The button in the overlay handles it.
        return;
      }
      
      // Check paywall limits
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
          const maxSessions = subscriptionTier === 'Plus' ? 5 : 1;
          if (count !== null && count >= maxSessions) {
            limitReached = true;
          }
        }
      }
      
      setIsChatActive(true);
      setInputValue('');
      
      if (limitReached) {
        setHasAccess(false);
      } else {
        setHasAccess(true);
        startInvestigation();
      }
    } else {
      if (!inputValue.trim()) return;
      handleSendReply(inputValue);
      setInputValue('');
    }
  };

  useEffect(() => {
    if (shouldAutoStart && inputValue) {
      handleStartOrReply();
    }
  }, [shouldAutoStart, inputValue]);

  const exitChat = useCallback(() => {
    setIsChatActive(false);
    setInputValue('');
    setCategory('');
    setHasAccess(null);
    resetDiagnosis();
  }, [resetDiagnosis]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
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
            className="flex-1 pb-32"
          >
            {vehicles.length === 0 ? (
              <div className="glass rounded-3xl p-12 mt-12 flex flex-col items-center text-center max-w-lg mx-auto shadow-sm">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
                  <Car className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Welcome to Repyr</h3>
                <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
                  Add your first vehicle to start tracking diagnostics, maintenance logs, and get intelligent AI recommendations.
                </p>
                <button 
                  onClick={() => navigate('/garage/add')}
                  className="bg-primary text-white px-8 py-3.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  Add a Vehicle
                </button>
              </div>
            ) : (
              <div className="mt-12 flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-4">
                <div className="mb-8">
                  <h1 className="text-3xl md:text-[32px] font-normal text-primary tracking-tighter leading-tight mb-4">
                    Let's fix your {selectedVehicle?.model}.
                  </h1>
                </div>
                
                {/* Common Issue Prompts */}
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {VEHICLE_CATEGORIES.map((cat, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setCategory(category === cat ? '' : cat)}
                      className={`px-5 py-3 rounded-full border text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${
                        category === cat
                          ? 'bg-white border-primary text-primary shadow-[0_4px_16px_rgba(0,98,255,0.2)]'
                          : 'bg-white border-gray-100 text-gray-600 shadow-[0_2px_8px_rgba(0,0,0,0.03)]'
                      }`}
                    >
                      {cat}
                    </motion.button>
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
              handleUpgrade={() => {}}
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
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsVehicleSelectorOpen(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Select Vehicle</h3>
                <button onClick={() => setIsVehicleSelectorOpen(false)} className="p-2 -mr-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {vehicles.map(v => (
                  <button 
                    key={v.id}
                    onClick={() => {
                      setSelectedVehicle(v);
                      setIsVehicleSelectorOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all ${
                      selectedVehicle?.id === v.id 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'bg-secondary/50 hover:bg-secondary border border-transparent text-foreground'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-[16px] tracking-tight">{v.year} {v.make} {v.model}</p>
                      {v.vin && <p className="text-xs opacity-70 font-mono mt-0.5">{v.vin}</p>}
                    </div>
                    {selectedVehicle?.id === v.id && <CheckCircle className="w-5 h-5 text-primary" />}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => {
                  setIsVehicleSelectorOpen(false);
                  const count = parseInt(localStorage.getItem('diagnostics_run_count') || '0', 10);
                  if (count >= 1 && subscriptionTier === 'Trial') {
                    navigate('/settings/subscription');
                  } else {
                    navigate('/garage/add');
                  }
                }}
                className="w-full mt-4 flex items-center justify-center py-3 rounded-xl border border-dashed border-primary/40 text-primary hover:bg-primary/10 transition-colors font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Vehicle
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Guest Redirect Overlay */}
      <AnimatePresence>
        {guestRedirectMessage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md px-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border border-border"
            >
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-3 tracking-tight">Analyzing Symptoms...</h3>
              <p className="text-muted-foreground font-medium text-[15px] leading-relaxed mb-8">
                Sign up to complete the chat and view your diagnosis.
              </p>
              <button
                onClick={() => {
                  const pendingChat = {
                    vehicle: selectedVehicle,
                    symptoms: inputValue.trim() || category
                  };
                  localStorage.setItem('pending_guest_chat', JSON.stringify(pendingChat));
                  navigate('/auth', { state: { fromGuestChat: true } });
                }}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-bold tracking-wide shadow-[0_4px_14px_0_rgba(0,118,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,118,255,0.23)] hover:-translate-y-0.5 transition-all active:scale-95"
              >
                Sign Up to Continue
              </button>
              <button
                onClick={() => setGuestRedirectMessage(false)}
                className="w-full mt-3 py-2.5 text-muted-foreground font-medium hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
