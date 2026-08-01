import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isGuest: boolean;
  guestVehicle: any | null;
  subscriptionTier: 'Trial' | 'Plus' | 'Pro';
  setGuestMode: (mode: boolean, vehicle?: any) => void;
  setSubscriptionTier: (tier: 'Trial' | 'Plus' | 'Pro') => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isGuest: false,
  guestVehicle: null,
  subscriptionTier: 'Trial',
  setGuestMode: () => {},
  setSubscriptionTier: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [guestVehicle, setGuestVehicle] = useState<any | null>(null);
  const [subscriptionTier, setSubscriptionTierState] = useState<'Trial' | 'Plus' | 'Pro'>('Trial');

  const handleSetGuestMode = (mode: boolean, vehicle?: any) => {
    setIsGuest(mode);
    if (vehicle) setGuestVehicle(vehicle);
    else setGuestVehicle(null);
  };

  const fetchProfileTier = async (userId: string) => {
    try {
      console.log("Fetching profile tier for user:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();
      
      console.log("DB returned data:", data, "error:", error);

      if (data?.subscription_tier) {
         const rawTier = String(data.subscription_tier).trim();
         const normalized = rawTier.charAt(0).toUpperCase() + rawTier.slice(1).toLowerCase();
         console.log("Normalized tier:", normalized);
         if (['Trial', 'Plus', 'Pro'].includes(normalized)) {
            console.log("Setting tier to:", normalized);
            setSubscriptionTierState(normalized as 'Trial' | 'Plus' | 'Pro');
         } else {
            console.warn("Tier did not match expected values:", normalized);
         }
      } else {
         console.warn("No subscription_tier found in data.");
      }
    } catch (e) {
      console.error("Failed to fetch subscription tier", e);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsGuest(false);
        await fetchProfileTier(session.user.id);
      } else {
        setSubscriptionTierState('Trial');
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsGuest(false);
        await fetchProfileTier(session.user.id);
      } else {
        setSubscriptionTierState('Trial');
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      isLoading, 
      isGuest, 
      guestVehicle, 
      subscriptionTier,
      setGuestMode: handleSetGuestMode,
      setSubscriptionTier: setSubscriptionTierState 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
