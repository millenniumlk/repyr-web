import { useState, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/AuthContext';
import { Button } from './ui/Button';
import repyrLogo from '../assets/repyr-logo.png';

const Auth = lazy(() => import('../pages/Auth'));

export function HomeHeader() {
  const { user, isGuest, setGuestMode } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);



  const handleDiagnoseClick = () => {
    if (!user && !isGuest) {
      setGuestMode(true);
    }
    navigate('/diagnose');
  };



  const userName = isGuest ? 'Guest User' : (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'U');
  const displayInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-card/90 backdrop-blur-md border-b border-border transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Left: Logo & Links */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
                <img 
                  src={repyrLogo} 
                  alt="Repyr" 
                  className="h-8 sm:h-10 w-auto object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </Link>

              <div className="hidden md:flex items-center gap-6">
                <button 
                  onClick={handleDiagnoseClick}
                  className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Diagnose
                </button>
                <Link to="/obd" className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors">
                  OBD-II Troubleshooter
                </Link>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-4">
              
              {(!user && !isGuest) ? (
                <Button 
                  onClick={() => setIsAuthOpen(true)}
                  size="sm"
                  className="font-bold shadow-button-primary px-5 h-8 text-xs"
                >
                  Login
                </Button>
              ) : (
                <Link to="/diagnose/settings" className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold border border-primary/20 hover:border-primary/40 transition-colors text-sm">
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : displayInitial}
                </Link>
              )}

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="text-muted-foreground h-8 w-8 p-0"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
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
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-[100dvh] w-64 bg-card z-[101] shadow-2xl flex flex-col border-l border-border md:hidden"
              >
                <div className="p-4 h-16 flex items-center justify-between border-b border-border">
                  <span className="text-lg font-bold">Menu</span>
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="-mr-2 text-muted-foreground"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="flex-1 flex flex-col px-4 py-6 space-y-4">
                  <Link 
                    to="/obd" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 text-lg font-medium text-foreground hover:bg-secondary rounded-xl"
                  >
                    OBD II Troubleshooter
                  </Link>
                  <button 
                    onClick={() => { setIsMobileMenuOpen(false); handleDiagnoseClick(); }}
                    className="px-4 py-3 text-lg font-medium text-left text-foreground hover:bg-secondary rounded-xl bg-primary text-primary-foreground font-bold shadow-button-primary"
                  >
                    Diagnose Issue
                  </button>
                </div>

                <div className="p-4 border-t border-border">
                  {(user && !isGuest) && (
                    <Link 
                      to="/diagnose/settings" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
                        {user.user_metadata?.avatar_url ? (
                           <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : displayInitial}
                      </div>
                      <span className="font-semibold">{userName}</span>
                    </Link>
                  )}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </header>
      {isAuthOpen && (
        <Suspense fallback={null}>
          <Auth isModal={true} onClose={() => setIsAuthOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
