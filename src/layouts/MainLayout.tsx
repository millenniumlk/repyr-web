import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Car, FileText, Settings as SettingsIcon, LogOut, ChevronLeft, ChevronRight, Bell, Menu, X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';



const MainLayout = () => {
  const location = useLocation();
  const { isGuest, user } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [guestRestrictedFeature, setGuestRestrictedFeature] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<{ full_name?: string, avatar_url?: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && !isGuest) {
        try {
          const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
          if (data) setProfile(data);
        } catch (error) {
          console.error('Error fetching profile for sidebar:', error);
        }
      }
    };
    fetchProfile();
  }, [user, isGuest]);

  const userName = isGuest ? 'Guest User' : (profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0]);
  const avatarUrl = !isGuest && (profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture);
  const displayInitial = userName ? userName.charAt(0).toUpperCase() : 'U';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    if (isGuest) {
      window.location.href = '/auth';
    } else {
      await supabase.auth.signOut();
    }
  };

  const navItems = [
    { name: 'Home', path: '/', icon: Home, exact: true },
    { name: 'Garage', path: '/garage', icon: Car, exact: false },
    { name: 'Diagnostic Logs', path: '/history', icon: FileText, exact: false },
    { name: 'Notifications', path: '/notifications', icon: Bell, exact: false },
    { name: 'Settings', path: '/settings', icon: SettingsIcon, exact: false },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans relative">
      {/* Fixed Background Gradient (Mimics AppBackgroundGradient) */}
      <div className="fixed inset-0 bg-gradient-to-b from-background to-primary/15 pointer-events-none -z-10" />

      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-border h-screen sticky top-0 transition-all duration-300 z-40 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className={`p-6 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isSidebarCollapsed && (
            <Link to="/" onClick={(e) => { if (location.pathname === '/') { e.preventDefault(); window.location.href = '/'; } }}>
              <h1 className="text-2xl font-black text-black tracking-tighter hover:opacity-80 transition-opacity">Repyr</h1>
            </Link>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path);
              
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={(e) => {
                  if (isGuest && item.path !== '/') {
                    e.preventDefault();
                    setGuestRestrictedFeature(item.name);
                    return;
                  }
                  if (location.pathname === item.path && item.path === '/') {
                    e.preventDefault();
                    window.location.href = '/';
                  }
                }}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-bold' 
                    : 'text-black font-medium hover:bg-secondary'
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : 'opacity-70'}`} />
                {!isSidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border relative" ref={menuRef}>
          {/* Popover Menu */}
          {isProfileMenuOpen && !isGuest && (
            <div className={`absolute bottom-full left-4 mb-2 bg-white rounded-xl shadow-lg border border-border overflow-hidden z-50 ${isSidebarCollapsed ? 'w-48 left-2' : 'right-4'}`}>
              <Link 
                to="/settings/profile"
                onClick={() => setIsProfileMenuOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <SettingsIcon className="w-4 h-4 text-primary shrink-0" />
                Edit Profile
              </Link>
              <button 
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-destructive hover:bg-red-50 transition-colors border-t border-border"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Sign out
              </button>
            </div>
          )}

          {/* Profile Trigger */}
          <button 
            onClick={() => {
              if (isGuest) {
                setGuestRestrictedFeature('Profile');
              } else {
                setIsProfileMenuOpen(!isProfileMenuOpen);
              }
            }}
            className={`w-full flex items-center gap-3 px-2 py-2 -mx-2 rounded-xl hover:bg-secondary/50 transition-colors group text-left ${isSidebarCollapsed ? 'justify-center' : ''}`}
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/20 shadow-sm group-hover:border-primary/40 transition-colors shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
              ) : (
                isGuest ? 'G' : displayInitial
              )}
            </div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                  {userName}
                </p>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Standard Responsive Mobile Header */}
      {!location.pathname.includes('/settings/profile') && !location.pathname.includes('/settings/subscription') && !location.pathname.includes('/garage/add') && (
        <header className={`md:hidden flex items-center justify-between px-4 h-16 bg-transparent ${location.pathname === '/' ? 'sticky top-0 z-30' : ''}`}>
        <Link to="/" onClick={(e) => { if (location.pathname === '/') { e.preventDefault(); window.location.href = '/'; } }}>
          <h1 className={location.pathname === '/' ? "text-xl font-black text-black tracking-tighter" : "text-[19px] font-bold text-foreground tracking-tight"}>
            {location.pathname === '/' ? 'Repyr.' 
             : location.pathname.startsWith('/garage') ? 'Garage'
             : location.pathname.startsWith('/history') ? 'Diagnostic Logs'
             : location.pathname.startsWith('/settings') ? 'Settings'
             : location.pathname.startsWith('/notifications') ? 'Notifications'
             : 'Repyr.'}
          </h1>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent">
        <div className="md:p-8 flex-1 max-w-7xl mx-auto w-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Standard Responsive Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[100] md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-[100dvh] w-64 bg-white z-[101] shadow-2xl flex flex-col border-r border-border md:hidden"
            >
              <div className="p-4 h-16 flex items-center justify-between border-b border-border">
                <Link 
                  to="/" 
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    if (location.pathname === '/') {
                      e.preventDefault();
                      window.location.href = '/';
                    }
                  }}
                >
                  <h1 className="text-xl font-black text-black tracking-tighter">Repyr.</h1>
                </Link>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto no-scrollbar">
                {navItems.map((item) => {
                  const isActive = item.exact 
                    ? location.pathname === item.path 
                    : location.pathname.startsWith(item.path);
                    
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={(e) => {
                        setIsMobileMenuOpen(false);
                        if (isGuest && item.path !== '/') {
                          e.preventDefault();
                          setGuestRestrictedFeature(item.name);
                          return;
                        }
                        if (location.pathname === item.path && item.path === '/') {
                          e.preventDefault();
                          window.location.href = '/';
                        }
                      }}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-primary/10 text-primary font-bold' 
                          : 'text-foreground/80 font-medium hover:bg-secondary'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : 'opacity-70'}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-border bg-gray-50/50">
                <div className="flex items-center gap-3 px-2 py-2 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/20 shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                    ) : (
                      isGuest ? 'G' : displayInitial
                    )}
                  </div>

                  <div className="overflow-hidden flex-1">
                    <p className="text-sm font-bold text-foreground truncate">
                      {userName}
                    </p>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Free Plan</p>
                  </div>
                </div>
                
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Guest Intercept Modal */}
      <AnimatePresence>
        {guestRestrictedFeature && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setGuestRestrictedFeature(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[24px] p-6 max-w-sm w-full shadow-2xl relative overflow-hidden text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <SettingsIcon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 tracking-tight">Unlock {guestRestrictedFeature}</h3>
              <p className="text-gray-500 mb-6 leading-relaxed text-[15px]">
                Sign up for a free account to {guestRestrictedFeature === 'Garage' ? 'save multiple vehicles and manage your virtual garage.' : guestRestrictedFeature === 'Diagnostic Logs' ? 'automatically save your diagnosis history and never lose a report.' : 'unlock all premium features and customize your experience.'}
              </p>
              
              <Link
                to="/auth"
                onClick={() => setGuestRestrictedFeature(null)}
                className="w-full block text-center bg-primary text-white font-bold py-3.5 rounded-xl transition-all hover:bg-primary-dark shadow-lg shadow-primary/30 mb-3"
              >
                Sign Up to Continue
              </Link>
              <button 
                onClick={() => setGuestRestrictedFeature(null)}
                className="w-full py-3.5 font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Not Now
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainLayout;
