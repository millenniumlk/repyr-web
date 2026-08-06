import packageJson from '../../package.json';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Car, Shield, HelpCircle, CreditCard, Sparkles, ChevronRight, LogOut, FileText } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';

const ActionRow = ({ icon: Icon, title, onClick, value, isAction, isLast }: any) => (
  <Button 
    variant="ghost"
    onClick={onClick}
    className={`w-full h-auto flex items-center justify-between pl-4 pr-4 py-0 rounded-none bg-transparent hover:bg-muted/50 group ${!isLast ? 'border-b border-border/60' : ''}`}
  >
    <div className="flex items-center">
      <div className="mr-3 py-3.5">
        <Icon className="w-[22px] h-[22px] text-primary" strokeWidth={2.2} />
      </div>
      <span className={`text-base tracking-tight ${isAction ? 'text-primary font-bold' : 'font-medium text-foreground'}`}>
        {title}
      </span>
    </div>
    <div className="flex items-center gap-2 py-4 justify-end flex-1 pl-4">
      {value === 'Pro' && (
        <span className="bg-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-indigo-200">
          Pro
        </span>
      )}
      {value === 'Plus' && (
        <span className="bg-blue-100 text-blue-700 text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-blue-200">
          Plus
        </span>
      )}
      {value === 'Trial' && (
        <span className="bg-muted text-muted-foreground text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
          Trial
        </span>
      )}
      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-muted-foreground transition-colors" strokeWidth={2.2} />
    </div>
  </Button>
);

const Settings = () => {
  const navigate = useNavigate();
  const { user, isGuest, setGuestMode, subscriptionTier, isLoading: authLoading } = useAuth();

  
  const [profile, setProfile] = useState<{ full_name?: string, avatar_url?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
        if (data) {
          setProfile(data);
        }
      }
      
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleManageSubscription = () => {
    navigate('/settings/subscription');
  };



  const handleLogout = async () => {
    if (isGuest) {
      setGuestMode(false);
    } else {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('pending_guest_chat');
    navigate('/auth');
  };

  if (loading || authLoading) {
    return (
      <div className="max-w-3xl mx-auto pb-10 px-4 md:px-0">
        <div className="max-w-xl mx-auto px-1 mt-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full bg-muted animate-pulse mb-4" />
            <div className="h-6 w-32 bg-muted animate-pulse rounded-lg mb-2" />
            <div className="h-4 w-44 bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="space-y-7">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-3 w-16 bg-muted animate-pulse rounded-lg ml-3" />
                <div className="bg-card border border-border rounded-[28px] p-1 space-y-0.5">
                  <div className="h-14 bg-muted/50 animate-pulse rounded-[24px]" />
                  <div className="h-14 bg-muted/50 animate-pulse rounded-[24px]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || (isGuest ? 'Guest User' : user?.email?.split('@')[0]);
  const displayInitial = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : (user?.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : (isGuest ? 'U' : user?.email?.charAt(0).toUpperCase()));
  const displayAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url;

  return (
    <div className="max-w-3xl mx-auto pb-10 px-4 md:px-0">
      <div className="hidden md:block mb-6 px-1 mt-2">
        <h1 className="text-3xl font-bold text-foreground tracking-tight leading-tight">Settings</h1>
      </div>

      <div className="max-w-xl mx-auto px-1 mt-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="items-center mb-8 flex flex-col"
        >
          <div className="w-24 h-24 rounded-full bg-card border-2 border-border items-center justify-center flex overflow-hidden mb-4 shadow-sm shadow-border/50">
            {displayAvatar ? (
              <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center border border-primary/10">
                <span className="text-primary text-3xl font-black pt-1 leading-none">
                  {displayInitial}
                </span>
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1 tracking-tight">{displayName}</h2>
          <p className="text-sm text-muted-foreground font-medium">{isGuest ? 'Not signed in' : user?.email}</p>
        </motion.div>

        <motion.div className="space-y-7" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-3 ml-3">
              Account
            </h4>
            <div className="bg-muted rounded-[28px] overflow-hidden border border-border shadow-sm shadow-black/5">
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
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-3 ml-3">
              Subscription
            </h4>
            <div className="bg-muted rounded-[28px] overflow-hidden border border-border shadow-sm shadow-black/5">
              <ActionRow 
                icon={subscriptionTier === 'Trial' ? Sparkles : CreditCard} 
                title={subscriptionTier === 'Trial' ? "Upgrade to Repyr Pro" : "Manage Subscription"} 
                onClick={handleManageSubscription}
                isAction={subscriptionTier === 'Trial'}
                value={subscriptionTier}
                isLast={true}
              />
            </div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-3 ml-3">
              Legal & Support
            </h4>
            <div className="bg-muted rounded-[28px] overflow-hidden border border-border shadow-sm shadow-black/5">
              <ActionRow 
                icon={Shield} 
                title="Privacy Policy" 
                onClick={() => navigate('/privacy')} 
                isLast={false}
              />
              <ActionRow 
                icon={FileText} 
                title="Terms & Conditions" 
                onClick={() => navigate('/terms')} 
                isLast={false}
              />
              <ActionRow 
                icon={HelpCircle} 
                title="Help & Support" 
                onClick={() => navigate('/support')}
                isLast={true}
              />
            </div>
          </motion.div>
        </motion.div>

        <div className="pt-8 mt-4 mb-8">
          <Button 
            variant="destructive"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="w-5 h-5 mr-2" strokeWidth={2.5} />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="text-center pb-8 mt-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
          Repyr Diagnostics v{packageJson.version}
        </p>
      </div>
    </div>
  );
};

export default Settings;
