import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gauge, Wrench, Car, Cpu } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { HomeHeader } from '../components/HomeHeader';

const CATEGORIES = [
  { id: 'p', name: 'Powertrain', icon: Gauge, desc: 'Engine, transmission, and emissions' },
  { id: 'c', name: 'Chassis', icon: Wrench, desc: 'Brakes, steering, and suspension' },
  { id: 'b', name: 'Body', icon: Car, desc: 'Airbags, AC, and interior systems' },
  { id: 'u', name: 'Network', icon: Cpu, desc: 'Communication between modules' },
];

export default function OBDHub() {
  const navigate = useNavigate();
  const [searchCode, setSearchCode] = useState('');
  const [popularCodes, setPopularCodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPopular = async () => {
      // Fetch top 30 codes to show in the popular grid
      const { data } = await supabase
        .from('obd_codes')
        .select('code, title, make')
        .eq('make', 'Generic')
        .limit(30);
      
      if (data) {
        setPopularCodes(data);
      }
      setIsLoading(false);
    };
    fetchPopular();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    
    navigate(`/obd/${searchCode.trim().toUpperCase()}/generic`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans overflow-x-hidden">
      <HomeHeader />
      
      <main className="flex-grow flex flex-col items-center pt-8 pb-24 px-4 sm:px-6">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Boxed Content (Left) */}
          <div className="lg:col-span-3 bg-card border border-border rounded-xl p-6 sm:p-12 flex flex-col">
            
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                The Ultimate OBD-II Directory
              </h1>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-8">
                Search over 3,000+ diagnostic trouble codes. Get instant, mechanic-written guides for symptoms, causes, fixes, and estimated repair costs.
              </p>
              
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                <input 
                  type="text" 
                  placeholder="Enter Code (e.g. P0420)" 
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase font-medium placeholder:normal-case"
                  required
                />
                <Button type="submit" size="lg" className="rounded-full px-8 font-semibold shadow-button-primary shrink-0">
                  Search Code
                </Button>
              </form>
            </div>

            {/* Categories */}
            <section className="mb-16">
              <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">Browse by Category</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {CATEGORIES.map(cat => (
                  <Link 
                    key={cat.id} 
                    to={`/obd/category/${cat.id}`}
                    className="group border border-border p-5 rounded-2xl hover:border-primary/50 hover:bg-secondary/50 transition-all flex items-center gap-4"
                  >
                    <div className="bg-primary/10 p-3 rounded-xl text-primary group-hover:scale-110 transition-transform shrink-0">
                      <cat.icon className="w-6 h-6" strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{cat.name}</h3>
                      <p className="text-muted-foreground text-sm leading-tight">{cat.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Popular Codes */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">Most Searched Codes</h2>
              
              {isLoading ? (
                <div className="py-12 text-center text-muted-foreground">Loading popular codes...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {popularCodes.slice(0, 20).map((codeItem) => (
                    <Link 
                      key={codeItem.code} 
                      to={`/obd/${codeItem.code}/generic`}
                      className="flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-full hover:border-primary hover:text-primary transition-colors text-sm font-medium shadow-sm group"
                    >
                      <span className="text-primary font-bold">{codeItem.code}</span>
                      <span className="text-muted-foreground group-hover:text-primary/80 truncate">{codeItem.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

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
            </div>
          </div>
          
        </div>
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
