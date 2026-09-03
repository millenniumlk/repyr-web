import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/AuthContext';
import { HomeHeader } from '../components/HomeHeader';
import { OBDTroubleshooter } from '../components/OBDTroubleshooter';
import { BrandSelectorGrid } from '../components/BrandSelectorGrid';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { decodeVIN } from '../services/nhtsaService';
import { Helmet } from 'react-helmet-async';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, isGuest, setGuestMode } = useAuth();
  
  const [vin, setVin] = useState('');
  const [isDecodingVin, setIsDecodingVin] = useState(false);

  const handleDecodeVIN = async () => {
    if (!vin || vin.length !== 17) {
      alert("Please enter a valid 17-digit VIN.");
      return;
    }
    
    setIsDecodingVin(true);
    try {
      const decoded = await decodeVIN(vin.toUpperCase());
      if (decoded && decoded.make) {
        let route = `/cars/${encodeURIComponent(decoded.make.toLowerCase())}`;
        if (decoded.model) {
          route += `/${encodeURIComponent(decoded.model.toLowerCase())}`;
          if (decoded.year) {
            route += `/${encodeURIComponent(decoded.year)}`;
          }
        }
        navigate(route);
      } else {
        alert("Could not decode this VIN. Please check it and try again.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while decoding the VIN.");
    } finally {
      setIsDecodingVin(false);
    }
  };

  const handleCodeSubmit = (code: string, label: string) => {
    const isDtc = /^[PCBU]\d{4}$/i.test(code);
    
    if (isDtc) {
      // If it's a valid OBD-II code, navigate directly to the dedicated SEO page
      navigate(`/obd/${code.toUpperCase()}`);
    } else {
      // If it's a symptom or general issue, start an AI chat diagnosis
      const symptom = `${code} - ${label}`;
      const pendingChat = { symptoms: symptom, needsProfileComplete: false };
      localStorage.setItem('pending_guest_chat', JSON.stringify(pendingChat));
      if (!user && !isGuest) {
        setGuestMode(true);
        navigate('/diagnose');
      } else {
        navigate('/diagnose');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans overflow-x-hidden">
      <Helmet>
        <title>Repyr - Free OBD-II Code Lookup & AI Car Diagnostics</title>
        <meta name="description" content="Get complete OBD-II diagnostics, repair solutions, cost estimates, OEM parts, and safety recall data powered by AI. Decode your VIN for free." />
      </Helmet>
      
      {/* Fixed Background */}
      <div className="fixed inset-0 bg-app-gradient -z-50 pointer-events-none" />
      
      <HomeHeader />

      <main className="flex-grow flex flex-col items-center pt-8 pb-24 px-4 sm:px-6">
        
        {/* Top Section with Sidebar Layout */}
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-4 gap-6 mb-20">
          
          {/* Main Boxed Content (Left) */}
          <div className="lg:col-span-3 bg-card border border-border rounded-xl p-6 sm:p-12 flex flex-col items-center">
            
            {/* Hero Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-full max-w-4xl text-center mb-16"
            >
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                Free OBD-II Code Lookup & Car Diagnostics
              </h1>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-8">
                Get complete OBD-II diagnostics, repair solutions, cost estimates, and safety recall data powered by AI.
              </p>
              <Button 
                size="lg"
                onClick={() => {
                  if (!user && !isGuest) {
                    setGuestMode(true);
                  }
                  navigate('/diagnose');
                }}
                className="font-semibold text-lg px-8 shadow-button-primary"
              >
                Start Free Diagnosis <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>

            {/* OBD Troubleshooter */}
            <motion.div 
              id="obd-troubleshooter"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-3xl scroll-mt-24"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">OBD-II Troubleshooter</h2>
                <p className="text-muted-foreground">Instantly find code meanings and repair advice</p>
              </div>
              <OBDTroubleshooter onCodeSubmit={handleCodeSubmit} />
              
              <div className="mt-8 pt-8 border-t border-border">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 text-center">
                  Popular OBD Codes
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { code: 'P0300', title: 'Random Misfire' },
                    { code: 'P0420', title: 'Catalyst Efficiency' },
                    { code: 'P0171', title: 'System Too Lean' },
                    { code: 'P0455', title: 'Evap Gross Leak' },
                    { code: 'P0113', title: 'Intake Air Temp' },
                    { code: 'P0135', title: 'O2 Sensor Heater' },
                    { code: 'P0101', title: 'MAF Sensor Circuit' },
                    { code: 'P0340', title: 'Camshaft Position' },
                    { code: 'P0401', title: 'EGR Flow Insufficient' },
                    { code: 'P0700', title: 'Transmission Control' }
                  ].map((item) => (
                    <Link
                      key={item.code}
                      to={`/obd/${item.code}`}
                      className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-full hover:border-primary hover:text-primary transition-colors text-sm font-medium shadow-sm group"
                    >
                      <span className="text-primary font-bold">{item.code}</span>
                      <span className="text-muted-foreground group-hover:text-primary/80">{item.title}</span>
                    </Link>
                  ))}
                </div>
                <div className="text-center mt-6">
                  <Link to="/obd" className="text-sm font-bold text-primary hover:underline">
                    View all OBD-II codes &rarr;
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar (Right) */}
          <div className="space-y-6 sticky top-24">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-bold text-lg mb-4 text-foreground">All OBD-II Codes</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/obd/category/p" className="text-foreground hover:text-primary transition-colors flex items-center text-sm font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mr-3"></span>
                    Powertrain (P) Codes
                  </Link>
                </li>
                <li>
                  <Link to="/obd/category/u" className="text-foreground hover:text-primary transition-colors flex items-center text-sm font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mr-3"></span>
                    Network (U) Codes
                  </Link>
                </li>
                <li>
                  <Link to="/obd/category/b" className="text-foreground hover:text-primary transition-colors flex items-center text-sm font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mr-3"></span>
                    Body (B) Codes
                  </Link>
                </li>
                <li>
                  <Link to="/obd/category/c" className="text-foreground hover:text-primary transition-colors flex items-center text-sm font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mr-3"></span>
                    Chassis (C) Codes
                  </Link>
                </li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-bold text-lg mb-4 text-foreground">OBD Codes by Make</h3>
              <ul className="space-y-3">
                {[
                  'Ford', 'Chevrolet', 'Toyota', 'Honda', 
                  'Nissan', 'Jeep', 'BMW', 'Mercedes-Benz', 
                  'Audi', 'Volkswagen', 'Hyundai', 'Kia',
                  'Subaru', 'Lexus', 'Mazda', 'Dodge',
                  'GMC', 'Chrysler', 'Volvo', 'Porsche'
                ].map(make => (
                  <li key={make}>
                    <Link to={`/obd/make/${make.toLowerCase()}`} className="text-foreground hover:text-primary transition-colors flex items-center text-sm font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mr-3"></span>
                      {make} Codes
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-border">
                <Link to="/obd" className="text-sm font-bold text-primary hover:underline">
                  View all makes &rarr;
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Popular Brands & Safety Data */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-6xl"
        >
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Popular Brands & Safety Data</h2>
            <p className="text-muted-foreground mb-8">Check NHTSA safety recalls, investigations, and consumer complaints</p>
            
            <div className="max-w-md mx-auto mb-10 relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-primary/10 rounded-full blur opacity-75"></div>
              <div className="relative flex items-center bg-card border border-border rounded-full p-1.5 shadow-sm">
                <input 
                  type="text" 
                  placeholder="Or enter 17-digit VIN to auto-fill..." 
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleDecodeVIN()}
                  className="flex-1 bg-transparent px-4 py-2 focus:outline-none uppercase placeholder:normal-case font-medium"
                  maxLength={17}
                />
                <Button 
                  size="sm" 
                  onClick={handleDecodeVIN}
                  disabled={isDecodingVin || vin.length !== 17}
                  className="rounded-full px-6 font-semibold shadow-button-primary min-w-[120px]"
                >
                  {isDecodingVin ? <Loader2 className="w-4 h-4 animate-spin" /> : "Decode VIN"}
                </Button>
              </div>
            </div>
          </div>
          
          <BrandSelectorGrid 
            selectedMake={null}
            onSelectMake={(make) => {
              if (make) navigate(`/cars/${make.toLowerCase()}`);
            }}
          />

          <div className="mt-8 text-center">
            <Link 
              to="/cars" 
              className="inline-flex items-center justify-center px-6 py-3 border border-border bg-card hover:bg-muted text-foreground font-semibold rounded-full transition-colors shadow-sm"
            >
              View all makes <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 bg-card/50 backdrop-blur-sm mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground font-medium">
            © {new Date().getFullYear()} Repyr. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm font-semibold text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/support" className="hover:text-foreground transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
