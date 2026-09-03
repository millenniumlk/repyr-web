import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Car, FileText, Settings as SettingsIcon, LogOut, ChevronLeft, ChevronRight, Bell, Menu, X, User } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';


/** Routes where the mobile header should be hidden (these pages have their own headers) */
const MOBILE_HEADER_EXCLUDED_ROUTES = ['/settings/profile', '/settings/subscription', '/garage/add', '/complete-profile'];

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

  useEffect(() => {
    if (isGuest && location.pathname !== '/diagnose' && location.pathname !== '/diagnose/') {
      // For the time being, completely block guests from restricted routes
      window.location.href = '/diagnose';
    }
  }, [isGuest, location.pathname]);

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
    if (isMobileMenuOpen) document.body.classList.add('overflow-hidden');
    else document.body.classList.remove('overflow-hidden');
    return () => { document.body.classList.remove('overflow-hidden'); };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    if (isGuest) {
      window.location.href = '/auth';
    } else {
      await supabase.auth.signOut();
    }
  };

  const navItems = [
    { name: 'Home', path: '/diagnose', icon: Home, exact: true },
    { name: 'Garage', path: '/diagnose/garage', icon: Car, exact: false },
    { name: 'Diagnostic Logs', path: '/diagnose/history', icon: FileText, exact: false },
    { name: 'Notifications', path: '/diagnose/notifications', icon: Bell, exact: false },
    { name: 'Settings', path: '/diagnose/settings', icon: SettingsIcon, exact: false },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans relative">
      {/* Fixed background gradient that stays put during mobile scroll/bounce */}
      <div className="fixed inset-0 bg-app-gradient -z-50 pointer-events-none" />

      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col bg-card border-r border-border h-screen sticky top-0 transition-all duration-300 z-40 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className={`p-6 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isSidebarCollapsed && (
            <Link to="/">
              <h1 className="text-2xl font-black text-foreground tracking-tighter hover:opacity-80 transition-opacity">Repyr</h1>
            </Link>
          )}
          <Button 
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
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
                  if (isGuest && item.path !== '/diagnose') {
                    e.preventDefault();
                    setGuestRestrictedFeature(item.name);
                    return;
                  }
                  if (location.pathname === item.path && item.path === '/diagnose') {
                    e.preventDefault();
                    window.location.href = '/diagnose';
                  }
                }}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-bold' 
                    : 'text-foreground font-medium hover:bg-secondary'
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
            <div className={`absolute bottom-full left-4 mb-2 bg-card rounded-xl shadow-lg border border-border overflow-hidden z-50 ${isSidebarCollapsed ? 'w-48 left-2' : 'right-4'}`}>
              <Link 
                to="/diagnose/settings/profile"
                onClick={() => setIsProfileMenuOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <SettingsIcon className="w-4 h-4 text-primary shrink-0" />
                Edit Profile
              </Link>
              <Button 
                variant="ghost"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full h-auto flex justify-start gap-3 px-4 py-3 text-sm font-bold text-destructive hover:bg-red-50 hover:text-destructive rounded-none border-t border-border"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Sign out
              </Button>
            </div>
          )}

          {/* Profile Trigger */}
          <Button 
            variant="ghost"
            onClick={() => {
              if (isGuest) {
                setGuestRestrictedFeature('Profile');
              } else {
                setIsProfileMenuOpen(!isProfileMenuOpen);
              }
            }}
            className={`w-full h-auto flex items-center gap-3 px-2 py-2 -mx-2 rounded-xl hover:bg-secondary/50 group text-left ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/20 shadow-sm group-hover:border-primary/40 transition-colors shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
          </Button>
        </div>
      </aside>

      {/* Standard Responsive Mobile Header */}
      {!MOBILE_HEADER_EXCLUDED_ROUTES.some(route => location.pathname.includes(route)) && (
        <header className={`md:hidden flex items-center justify-between px-4 h-16 bg-transparent ${location.pathname === '/diagnose' ? 'sticky top-0 z-30' : ''}`}>
        <Link to="/diagnose" onClick={(e) => { if (location.pathname === '/diagnose') { e.preventDefault(); window.location.href = '/diagnose'; } }}>
          <h1 className={location.pathname === '/diagnose' ? "text-xl font-black text-foreground tracking-tighter" : "text-lg font-bold text-foreground tracking-tight"}>
            {location.pathname === '/diagnose' ? 'Repyr.' 
             : location.pathname.startsWith('/diagnose/garage') ? 'Garage'
             : location.pathname.startsWith('/diagnose/history') ? 'Diagnostic Logs'
             : location.pathname.startsWith('/diagnose/settings') ? 'Settings'
             : location.pathname.startsWith('/diagnose/notifications') ? 'Notifications'
             : 'Repyr.'}
          </h1>
        </Link>
        <Button 
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(true)}
          className="-mr-2 text-muted-foreground"
        >
          <Menu className="w-6 h-6" />
        </Button>
      </header>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent">
        <div className="md:p-8 flex-1 max-w-7xl mx-auto w-full relative">
          <Outlet context={{ isSidebarCollapsed }} />
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
              className="fixed top-0 left-0 h-[100dvh] w-64 bg-card z-[101] shadow-2xl flex flex-col border-r border-border md:hidden"
            >
              <div className="p-4 h-16 flex items-center justify-between border-b border-border">
                <Link 
                  to="/" 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <h1 className="text-xl font-black text-foreground tracking-tighter">Repyr.</h1>
                </Link>
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="-mr-2 text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </Button>
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
                        if (isGuest && item.path !== '/diagnose') {
                          e.preventDefault();
                          setGuestRestrictedFeature(item.name);
                          return;
                        }
                        if (location.pathname === item.path && item.path === '/diagnose') {
                          e.preventDefault();
                          window.location.href = '/diagnose';
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

              <div className="p-4 border-t border-border bg-muted/50">
                <div className="flex items-center gap-3 px-2 py-2 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/20 shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      isGuest ? 'G' : displayInitial
                    )}
                  </div>

                  <div className="overflow-hidden flex-1">
                    <p className="text-sm font-bold text-foreground truncate">
                      {userName}
                    </p>
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
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setGuestRestrictedFeature(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card rounded-[24px] p-6 max-w-sm w-full shadow-2xl relative overflow-hidden text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                {(() => {
                  const navItem = navItems.find(item => item.name === guestRestrictedFeature);
                  const Icon = navItem ? navItem.icon : guestRestrictedFeature === 'Profile' ? User : SettingsIcon;
                  return <Icon className="w-8 h-8 text-primary" />;
                })()}
              </div>
              <h3 className="text-xl font-bold mb-2 tracking-tight">Unlock {guestRestrictedFeature}</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed text-[15px]">
                Sign up for a free account to {guestRestrictedFeature === 'Garage' ? 'save multiple vehicles and manage your virtual garage.' : guestRestrictedFeature === 'Diagnostic Logs' ? 'automatically save your diagnosis history and never lose a report.' : 'unlock all premium features and customize your experience.'}
              </p>
              
              <Link
                to="/auth"
                state={{ isSignUp: true }}
                onClick={() => setGuestRestrictedFeature(null)}
                className="w-full block mb-3"
              >
                <Button className="w-full font-normal" type="button">
                  Sign Up to Continue
                </Button>
              </Link>
              <Button 
                variant="ghost"
                onClick={() => setGuestRestrictedFeature(null)}
                className="w-full text-muted-foreground hover:text-muted-foreground font-normal"
              >
                Not Now
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainLayout;
