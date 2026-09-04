import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Search, Loader2, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { HomeHeader } from '../components/HomeHeader';
import { Button } from '../components/ui/Button';

const ALL_MAKES = [
  "Generic", "Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", 
  "Chrysler", "Dodge", "Ford", "GMC", "Honda", "Infiniti", "Jaguar", 
  "Jeep", "Kia", "Lexus", "Lincoln", "Mazda", "Mercedes", "Mercury", 
  "Mitsubishi", "Nissan", "Oldsmobile", "Plymouth", "Pontiac", 
  "Saturn", "Subaru", "Toyota", "Volkswagen"
];

export default function OBDDirectory() {
  const { category, make } = useParams();
  const navigate = useNavigate();
  
  const isCategory = !!category;
  const isMake = !!make;
  
  const [codes, setCodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [makeFilter, setMakeFilter] = useState<string>('all');
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const itemsPerPage = 50;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Derive page title and metadata
  let pageTitle = '';
  let pageDescription = '';
  let dbFilter = '';

  if (isCategory) {
    const catUpper = category.toUpperCase();
    const catName = catUpper === 'P' ? 'Powertrain' : 
                    catUpper === 'B' ? 'Body' : 
                    catUpper === 'C' ? 'Chassis' : 
                    catUpper === 'U' ? 'Network' : 'Diagnostic';
    
    pageTitle = `${catName} (${catUpper}) OBD-II Codes`;
    pageDescription = `Browse our complete directory of ${catName} OBD-II diagnostic trouble codes starting with ${catUpper}.`;
    dbFilter = `${catUpper}%`;
  } else if (isMake) {
    const makeFormatted = make.charAt(0).toUpperCase() + make.slice(1);
    pageTitle = `${makeFormatted} OBD-II Codes`;
    pageDescription = `Browse common and specific OBD-II diagnostic trouble codes for ${makeFormatted} vehicles.`;
    // For makes, we just query by make
  }

  const fetchCodes = async (pageIndex: number, search: string = '') => {
    setIsLoading(true);
    let query = supabase.from('obd_codes')
      .select('code, title, make', { count: 'exact' })
      .neq('make', '_Invalid_Generic');

    if (isCategory) {
      // Show ALL codes for this category letter, regardless of Make
      query = query.like('code', dbFilter);
      
      if (makeFilter !== 'all') {
        query = query.eq('make', makeFilter);
      }
    } else if (isMake) {
      // For Make pages, we query by make case-insensitively to support BMW, GMC, etc.
      query = query.ilike('make', make);
    }

    if (search) {
      query = query.or(`code.ilike.%${search}%,title.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('code', { ascending: true })
      .range(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage - 1);

    if (error) {
      console.error("Error fetching codes:", error);
    } else {
      if (pageIndex === 0) {
        setCodes(data || []);
        if (count !== null) setTotalCount(count);
      } else {
        setCodes(prev => [...prev, ...(data || [])]);
      }
      setHasMore(data?.length === itemsPerPage);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    setPage(0);
    fetchCodes(0, debouncedSearch);
  }, [category, make, debouncedSearch, makeFilter]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCodes(nextPage, debouncedSearch);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans overflow-x-hidden">
      <Helmet>
        <title>{pageTitle} - Directory | Repyr</title>
        <meta name="description" content={pageDescription} />
      </Helmet>
      
      <HomeHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        <button onClick={() => navigate('/obd')} className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to OBD Hub
        </button>

        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
            {pageTitle}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            {pageDescription} Select a code below to view detailed diagnostic information, common symptoms, causes, and step-by-step repair guides.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-border rounded-xl bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Filter codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {isCategory && (
            <select
              value={makeFilter}
              onChange={(e) => setMakeFilter(e.target.value)}
              className="px-4 py-3 border border-border rounded-xl bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-w-[200px]"
            >
              <option value="all">All Makes</option>
              {ALL_MAKES.map(m => (
                <option key={m} value={m}>{m === 'Generic' ? 'Generic (All Makes)' : m}</option>
              ))}
            </select>
          )}
        </div>

        {totalCount !== null && !isLoading && page === 0 && (
          <div className="mb-4 text-sm font-medium text-muted-foreground">
            Found <strong className="text-foreground">{totalCount}</strong> {totalCount === 1 ? 'code' : 'codes'}
          </div>
        )}

        <div className="bg-card rounded-2xl border border-border overflow-hidden mb-8">
          {codes.length === 0 && !isLoading ? (
            <div className="p-12 text-center text-muted-foreground">
              No codes found in this directory. 
              {isMake && " Check back later as our AI continuously adds new codes when users search for them!"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:gap-px bg-border">
              {codes.map((codeItem) => (
                <Link 
                  key={`${codeItem.code}-${codeItem.make}`} 
                  to={`/obd/${codeItem.code}/${codeItem.make !== 'Generic' ? codeItem.make.toLowerCase() : 'generic'}`}
                  className="flex items-center justify-between p-4 bg-card hover:bg-secondary/50 transition-colors group"
                >
                  <div className="min-w-0 pr-4">
                    <h3 className="font-bold text-lg text-primary group-hover:underline flex items-center gap-2">
                      {codeItem.code}
                      {codeItem.make !== 'Generic' && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">{codeItem.make}</span>
                      )}
                    </h3>
                    <p className="text-muted-foreground text-sm truncate">{codeItem.title}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {isLoading && (
          <div className="py-8 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          </div>
        )}

        {hasMore && !isLoading && (
          <div className="text-center">
            <Button onClick={loadMore} variant="outline" size="lg" className="font-bold">
              Load More Codes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
