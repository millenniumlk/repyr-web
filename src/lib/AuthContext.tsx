import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  /** Re-fetch the subscription tier from the database. This is the ONLY way to update the tier on the client. */
  refreshSubscriptionTier: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isGuest: false,
  guestVehicle: null,
  subscriptionTier: 'Trial',
  setGuestMode: () => {},
  refreshSubscriptionTier: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [guestVehicle, setGuestVehicle] = useState<any | null>(null);
  const [subscriptionTier, setSubscriptionTierState] = useState<'Trial' | 'Plus' | 'Pro'>('Trial');
  const userIdRef = useRef<string | null>(null);

  const handleSetGuestMode = (mode: boolean, vehicle?: any) => {
    setIsGuest(mode);
    if (vehicle) setGuestVehicle(vehicle);
    else setGuestVehicle(null);
  };

  const fetchProfileTier = useCallback(async (userId?: string) => {
    const resolvedId = userId || userIdRef.current;
    if (!resolvedId) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_expires_at')
        .eq('id', resolvedId)
        .single();

      if (data?.subscription_tier) {
         let rawTier = String(data.subscription_tier).trim();
         
         if (data.subscription_expires_at && new Date(data.subscription_expires_at).getTime() < Date.now()) {
           rawTier = 'Trial';
         }

         const normalized = rawTier.charAt(0).toUpperCase() + rawTier.slice(1).toLowerCase();
         if (['Trial', 'Plus', 'Pro'].includes(normalized)) {
            setSubscriptionTierState(normalized as 'Trial' | 'Plus' | 'Pro');
         }
      }
    } catch {
      // Silently fail — tier stays at current value
    }
  }, []);

  /** Public method: re-fetch the tier from the database. Cannot set an arbitrary value. */
  const refreshSubscriptionTier = useCallback(async () => {
    await fetchProfileTier();
  }, [fetchProfileTier]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }

      if (session) {
        // Validate the session against the server to catch deleted accounts
        const { data: { user: serverUser }, error } = await supabase.auth.getUser();
        if (error || !serverUser) {
          // User is no longer valid (e.g. deleted from another device)
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          userIdRef.current = null;
          setSubscriptionTierState('Trial');
          setIsLoading(false);
          return;
        }
      }

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        userIdRef.current = session.user.id;
        setIsGuest(false);
        await fetchProfileTier(session.user.id);
      } else {
        userIdRef.current = null;
        setSubscriptionTierState('Trial');
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        userIdRef.current = session.user.id;
        setIsGuest(false);
        await fetchProfileTier(session.user.id);
      } else {
        userIdRef.current = null;
        setSubscriptionTierState('Trial');
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileTier]);

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      isLoading, 
      isGuest, 
      guestVehicle, 
      subscriptionTier,
      setGuestMode: handleSetGuestMode,
      refreshSubscriptionTier,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
