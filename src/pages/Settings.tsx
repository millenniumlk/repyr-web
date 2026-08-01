import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Car, Shield, HelpCircle, CreditCard, Sparkles, ChevronRight, Loader2, LogOut } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

const ActionRow = ({ icon: Icon, title, onClick, isAction, isLast }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between pl-4 pr-4 bg-transparent hover:bg-gray-50/50 transition-colors group ${!isLast ? 'border-b border-gray-200/60' : ''}`}
  >
    <div className="flex items-center">
      <div className="mr-3 py-3.5">
        <Icon className="w-[22px] h-[22px] text-primary" strokeWidth={2.2} />
      </div>
      <span className={`text-[16px] tracking-tight ${isAction ? 'text-primary font-bold' : 'font-medium text-gray-900'}`}>
        {title}
      </span>
    </div>
    <div className="flex items-center gap-2 py-4 justify-end flex-1 pl-4">
      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors" strokeWidth={2.2} />
    </div>
  </button>
);

const Settings = () => {
  const navigate = useNavigate();
  const { user, isGuest, setGuestMode } = useAuth();
  
  const [subscriptionTier, setSubscriptionTier] = useState<'Trial' | 'Plus' | 'Pro'>('Trial');
  const [profile, setProfile] = useState<{ full_name?: string, avatar_url?: string, subscription_tier?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      let currentTier = 'Trial';
      const localTier = localStorage.getItem('subscription_tier');
      if (localTier === 'Pro' || localTier === 'Plus') {
        currentTier = localTier;
      }

      if (user) {
        const { data } = await supabase.from('profiles').select('full_name, avatar_url, is_pro').eq('id', user.id).single();
        if (data) {
          setProfile(data);
          if (data.is_pro) {
            currentTier = 'Pro';
          }
        }
      }
      
      setSubscriptionTier(currentTier as 'Trial' | 'Plus' | 'Pro');
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleManageSubscription = async () => {
    if (subscriptionTier !== 'Trial' && user) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paddle-portal`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.url) {
            window.location.href = result.url;
            return;
          }
        }
        
        alert("Failed to securely open the customer portal. Please contact support.");
      } catch (err) {
        console.error(err);
        alert("An error occurred while opening the portal.");
      }
    } else {
      navigate('/settings/subscription');
    }
  };

  const handleSupport = () => {
    alert('Support coming soon.');
  };

  const handleLogout = async () => {
    localStorage.removeItem('subscription_tier');
    if (isGuest) {
      setGuestMode(false);
    } else {
      await supabase.auth.signOut();
    }
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || (isGuest ? 'Guest User' : user?.email?.split('@')[0]);
  const displayInitial = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : (user?.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : (isGuest ? 'U' : user?.email?.charAt(0).toUpperCase()));
  const displayAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url;

  return (
    <div className="max-w-3xl mx-auto pb-10 px-4 md:px-0">
      <div className="hidden md:block mb-6 px-1 mt-2">
        <h1 className="text-3xl font-bold text-black tracking-tight leading-tight">Settings</h1>
      </div>

      <div className="max-w-xl mx-auto px-1 mt-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="items-center mb-8 flex flex-col"
        >
          <div className="w-24 h-24 rounded-full bg-white border-2 border-gray-100 items-center justify-center flex overflow-hidden mb-4 shadow-sm shadow-gray-200/50">
            {displayAvatar ? (
              <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center border border-primary/10">
                <span className="text-primary text-[32px] font-black pt-1 leading-none">
                  {displayInitial}
                </span>
              </div>
            )}
          </div>
          <h2 className="text-[20px] font-bold text-black mb-1 tracking-tight">{displayName}</h2>
          <p className="text-[14px] text-gray-500 font-medium">{isGuest ? 'Not signed in' : user?.email}</p>
        </motion.div>

        <div className="space-y-7">
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-black mb-3 ml-3">
              Account
            </h4>
            <div className="bg-gray-50 rounded-[28px] overflow-hidden border border-gray-100 shadow-sm shadow-black/5">
              <ActionRow 
                icon={User} 
                title="Edit Profile" 
                onClick={() => navigate('/settings/profile')} 
                isLast={false}
              />
              <ActionRow 
                icon={Car} 
                title="Manage Garage" 
                onClick={() => navigate('/garage')} 
                isLast={true}
              />
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-black mb-3 ml-3">
              Subscription
            </h4>
            <div className="bg-gray-50 rounded-[28px] overflow-hidden border border-gray-100 shadow-sm shadow-black/5">
              <ActionRow 
                icon={subscriptionTier === 'Trial' ? Sparkles : CreditCard} 
                title={subscriptionTier === 'Trial' ? "Upgrade to Repyr Pro" : "Manage Subscription"} 
                onClick={handleManageSubscription}
                isAction={subscriptionTier === 'Trial'}
                isLast={true}
              />
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-black mb-3 ml-3">
              Support
            </h4>
            <div className="bg-gray-50 rounded-[28px] overflow-hidden border border-gray-100 shadow-sm shadow-black/5">
              <ActionRow 
                icon={Shield} 
                title="Privacy & Security" 
                onClick={() => alert('Coming soon')} 
                isLast={false}
              />
              <ActionRow 
                icon={HelpCircle} 
                title="Help & Support" 
                onClick={handleSupport}
                isLast={true}
              />
            </div>
          </div>
        </div>

        <div className="pt-8 mt-4 flex flex-col items-center gap-4 mb-8">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-50 text-red-600 font-bold text-[15px] hover:bg-red-100 transition-colors shadow-sm"
          >
            <LogOut className="w-5 h-5" strokeWidth={2.5} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="text-center pb-8 mt-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">
          Repyr Diagnostics v1.0.4
        </p>
      </div>
    </div>
  );
};

export default Settings;
