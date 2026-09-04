import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronRight, Settings, AlertTriangle, DollarSign, Loader2, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { HomeHeader } from '../components/HomeHeader';
import ReactMarkdown from 'react-markdown';

export default function OBDDetail() {
  const { code, make } = useParams<{ code: string; make?: string }>();
  const navigate = useNavigate();
  
  const [codeData, setCodeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dynamicImage, setDynamicImage] = useState<string | null>(null);

  const [relatedCodes, setRelatedCodes] = useState<any[]>([]);
  const [relatedTotal, setRelatedTotal] = useState(0);
  const [relatedPage, setRelatedPage] = useState(0);
  const itemsPerPage = 6;


  const safeCode = code?.toUpperCase() || '';
  const safeMake = make ? make.charAt(0).toUpperCase() + make.slice(1).toLowerCase() : 'Generic';

  useEffect(() => {
    const fetchRelated = async () => {
      const { data, count } = await supabase
        .from('obd_codes')
        .select('code, title, make', { count: 'exact' })
        .ilike('make', safeMake)
        .neq('code', safeCode)
        .order('code', { ascending: true })
        .range(relatedPage * itemsPerPage, (relatedPage + 1) * itemsPerPage - 1);
        
      if (data) setRelatedCodes(data);
      if (count !== null) setRelatedTotal(count);
    };
    if (safeMake) {
      fetchRelated();
    }
  }, [safeMake, safeCode, relatedPage]);

  useEffect(() => {
    const fetchOrGenerateData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // 1. Check if we already have it in Supabase
        const { data } = await supabase
          .from('obd_codes')
          .select('*')
          .eq('code', safeCode)
          .eq('make', safeMake)
          .single();

        if (data && data.is_ai_generated) {
          // We have the full enriched data!
          setCodeData(data);
        } else {
          // If we only have the title (from our seed script), or we have nothing, we need to enrich it
          let title = data ? data.title : undefined;
          
          // Fallback: If we couldn't find the make-specific code, let's try to get the Generic title
          // to prevent the AI from hallucinating a completely wrong definition.
          if (!title) {
            const { data: genericData } = await supabase
              .from('obd_codes')
              .select('title')
              .eq('code', safeCode)
              .eq('make', 'Generic')
              .single();
              
            if (genericData && genericData.title) {
              title = genericData.title;
            }
          }
          
          if (!title) {
            // Code is not in our database at all. 
            // As per requirements, we redirect to diagnostic chat instead of hallucinating a new code.
            const symptom = `${safeMake !== 'Generic' ? safeMake + ' ' : ''}${safeCode} Code`;
            const pendingChat = { symptoms: symptom.trim(), needsProfileComplete: false };
            localStorage.setItem('pending_guest_chat', JSON.stringify(pendingChat));
            navigate('/diagnose', { replace: true });
            return;
          }
          
          setIsGenerating(true);
          // Call our Edge Function to generate the missing details
          const { data: edgeData, error: edgeError } = await supabase.functions.invoke('obd-enrichment', {
            body: { code: safeCode, make: safeMake, title }
          });

          if (edgeError) throw edgeError;

          // The edge function UPSERTS to the DB, but also returns the data directly
          setCodeData({
            code: safeCode,
            make: safeMake,
            title: title || 'Diagnostic Trouble Code',
            ...edgeData
          });
        }
        
        // Fetch dynamic image
        try {
          const rawQuery = `${safeMake !== 'Generic' ? safeMake : 'car'} ${safeCode} replacement part close up photo`;
          const { data: imgData } = await supabase.functions.invoke('fetch-diagrams', {
            body: { 
              rawQuery,
              rawCacheKey: `obd_photo_${safeCode}_${safeMake}`.toLowerCase()
            }
          });
          if (imgData?.images && imgData.images.length > 0) {
            setDynamicImage(imgData.images[0]);
          }
        } catch (imgErr) {
          console.error("Failed to fetch dynamic image:", imgErr);
        }

      } catch (err: any) {
        console.error("Failed to load OBD data:", err);
        setError("Failed to load diagnostic information for this code.");
      } finally {
        setIsLoading(false);
        setIsGenerating(false);
      }
    };

    if (safeCode) {
      fetchOrGenerateData();
    }
  }, [safeCode, safeMake]);

  // Clean the title just in case the AI included the code prefix
  const cleanTitle = codeData?.title 
    ? codeData.title.replace(new RegExp(`^${safeCode}[:\\s-]*`, 'i'), '') 
    : 'Engine Code';

  const pageTitle = `${safeCode} ${safeMake !== 'Generic' ? safeMake : ''} OBD-II Code - ${cleanTitle}`;
  const pageDescription = codeData?.quick_answer 
    ? `${safeMake !== 'Generic' ? safeMake + ' ' : ''}${safeCode}: ${codeData.quick_answer}`.substring(0, 160)
    : `Learn how to diagnose and fix the ${safeCode} ${safeMake !== 'Generic' ? safeMake + ' ' : ''}OBD-II trouble code (${cleanTitle}). Discover common symptoms, causes, and estimated repair costs.`;

  const faqSchema = codeData?.faqs && codeData.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": codeData.faqs.map((faq: any) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans overflow-x-hidden">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        {faqSchema && (
          <script type="application/ld+json">
            {JSON.stringify(faqSchema)}
          </script>
        )}
      </Helmet>
      
      <HomeHeader />

      <main className="flex-grow flex flex-col items-center pt-8 pb-24 px-4 sm:px-6">
        <div className="w-full max-w-6xl">
          {/* Breadcrumbs */}
          <div className="mb-6 flex items-center text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />
            <Link to="/obd" className="text-muted-foreground hover:text-foreground transition-colors">OBD-II Codes</Link>
            <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />
            <span className="font-semibold text-foreground">{safeCode}</span>
          </div>

          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold">
                {isGenerating ? 'AI is analyzing this specific code...' : 'Loading diagnostic data...'}
              </h2>
              {isGenerating && <p className="text-muted-foreground mt-2">Checking manufacturer bulletins and technical data.</p>}
            </div>
          ) : error ? (
            <div className="py-20 text-center bg-card rounded-xl border border-border p-12">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-4">{error}</h2>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-3 bg-card border border-border rounded-xl p-6 sm:p-12 space-y-8">
              <div>
                <div className="inline-block px-3 py-1 bg-secondary rounded-full text-sm font-bold text-muted-foreground mb-4">
                  {safeMake}
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
                  {safeCode}: {cleanTitle}
                </h1>
              </div>

              {/* Quick Answer Box */}
              <div className="bg-muted/30 border-l-4 border-primary p-6 rounded-r-2xl">
                <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                  Quick Answer
                </h2>
                {codeData.quick_answer && (
                  <p className="text-foreground/90 font-medium mb-4 text-lg">
                    {codeData.quick_answer}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 mt-4">
                  {codeData.severity && (
                    <div className="bg-background border border-border px-4 py-2 rounded-xl">
                      <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Severity</span>
                      <span className={`font-black ${codeData.severity.toLowerCase().includes('high') || codeData.severity.toLowerCase().includes('severe') ? 'text-destructive' : 'text-amber-500'}`}>{codeData.severity}</span>
                    </div>
                  )}
                  {codeData.drivability && (
                    <div className="bg-background border border-border px-4 py-2 rounded-xl flex-1 min-w-[200px]">
                      <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Drivability</span>
                      <span className="font-semibold text-sm">{codeData.drivability}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Inline CTA */}
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                    Diagnose this {safeCode} code with AI
                  </h3>
                  <p className="text-sm text-muted-foreground">Skip the guesswork. Let our AI Master Tech pinpoint the exact failing part on your specific {safeMake}.</p>
                </div>
                <Button onClick={() => navigate('/diagnose')} className="shrink-0 shadow-button-primary" size="lg">
                  Start AI Diagnosis
                </Button>
              </div>

              {/* Image / Diagram */}
              {dynamicImage && (
                <div className="rounded-3xl overflow-hidden border border-border bg-white flex items-center justify-center shadow-sm">
                  <img 
                    src={`https://cqhsvdipojpqhucfrdfx.supabase.co/functions/v1/proxy-image?url=${encodeURIComponent(dynamicImage)}`}
                    alt={`${safeMake !== 'Generic' ? safeMake + ' ' : ''}${safeCode} - ${cleanTitle} Auto Part`}
                    title={`${safeMake !== 'Generic' ? safeMake + ' ' : ''}${safeCode} ${cleanTitle}`}
                    className="w-full h-80 md:h-[400px] object-contain p-4"
                    onError={(e) => {
                      // Fallback if DuckDuckGo hotlink fails
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80";
                      (e.target as HTMLImageElement).className = "w-full h-80 md:h-[400px] object-cover";
                    }}
                  />
                </div>
              )}

              {/* Full Article */}
              {codeData.description && (
                <div className="max-w-none">
                  <h2 className="text-2xl font-bold flex items-center gap-2 mb-6 text-foreground">
                    What does the {safeCode} code mean?
                  </h2>
                  <ReactMarkdown
                    components={{
                      h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-xl font-bold mt-8 mb-3 text-foreground" {...props} />,
                      h4: ({node, ...props}) => <h4 className="text-lg font-bold mt-6 mb-2 text-foreground" {...props} />,
                      p: ({node, ...props}) => <p className="text-foreground/80 leading-relaxed mb-5" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-foreground" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-5 text-foreground/80 space-y-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-5 text-foreground/80 space-y-2" {...props} />,
                      li: ({node, ...props}) => <li {...props} />
                    }}
                  >
                    {codeData.description}
                  </ReactMarkdown>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-6">
                {codeData.symptoms && codeData.symptoms.length > 0 && (
                  <div className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-sm">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Activity className="w-6 h-6 text-amber-500" />
                      What You'll Notice
                    </h2>
                    <ul className="space-y-4">
                      {codeData.symptoms.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <span className="text-foreground/90 font-medium leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {codeData.causes && codeData.causes.length > 0 && (
                  <div className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-sm">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Settings className="w-6 h-6 text-destructive" />
                      Common Culprits
                    </h2>
                    <ul className="space-y-4">
                      {codeData.causes.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 bg-destructive/10 p-4 rounded-xl border border-destructive/20">
                          <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                          <span className="text-foreground/90 font-medium leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {codeData.fixes && codeData.fixes.length > 0 && (
                <div className="bg-card rounded-2xl p-6 md:p-10 border border-border shadow-sm">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <CheckCircle2 className="w-7 h-7 text-green-500" />
                    How to Fix the {safeCode} Code
                  </h2>
                  <div className="space-y-4">
                    {codeData.fixes.map((item: string, i: number) => (
                      <p key={i} className="text-foreground/90 leading-relaxed text-lg">
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              )}

                {/* FAQs Section */}
                {codeData.faqs && codeData.faqs.length > 0 && (
                  <div className="pt-8 border-t border-border mt-12">
                    <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                      {codeData.faqs.map((faq: any, i: number) => (
                        <div key={i} className="bg-card border border-border rounded-2xl p-6">
                          <h3 className="text-lg font-bold mb-2 text-foreground">{faq.question}</h3>
                          <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Codes Section */}
                {relatedCodes.length > 0 && (
                  <div className="pt-8 border-t border-border mt-12">
                    <h2 className="text-2xl font-bold mb-6">More {safeMake !== 'Generic' ? safeMake : ''} OBD-II Codes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {relatedCodes.map((rc) => (
                        <Link 
                          key={rc.code} 
                          to={`/obd/${rc.code.toLowerCase()}/${rc.make.toLowerCase()}`}
                          className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-lg text-primary">{rc.code}</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{rc.title}</p>
                        </Link>
                      ))}
                    </div>
                    
                    {/* Pagination Controls */}
                    {relatedTotal > itemsPerPage && (
                      <div className="flex items-center justify-between mt-8">
                        <p className="text-sm text-muted-foreground">
                          Showing {relatedPage * itemsPerPage + 1} to {Math.min((relatedPage + 1) * itemsPerPage, relatedTotal)} of {relatedTotal} codes
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={relatedPage === 0}
                            onClick={() => setRelatedPage(p => p - 1)}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={(relatedPage + 1) * itemsPerPage >= relatedTotal}
                            onClick={() => setRelatedPage(p => p + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>

            {/* Sidebar / Conversion Funnel */}
            <div className="lg:col-span-1 space-y-6 sticky top-24 self-start">
              {codeData.estimated_cost && (
                <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    Estimated Cost
                  </h3>
                  <p className="text-2xl font-black text-foreground mb-1">{codeData.estimated_cost}</p>
                  <p className="text-sm text-muted-foreground">Includes parts and labor.</p>
                </div>
              )}

              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4 text-foreground">OBD Codes by Make</h3>
                <ul className="space-y-3">
                  {[
                    "Ford", "Chevrolet", "Toyota", "Honda", "Nissan", 
                    "Jeep", "BMW", "Mercedes", "Audi", "Volkswagen", 
                    "Subaru", "Kia", "Mazda", "Dodge", "GMC"
                  ].map(sidebarMake => (
                    <li key={sidebarMake}>
                      <Link to={`/obd/make/${sidebarMake.toLowerCase()}`} className="text-foreground hover:text-primary transition-colors flex items-center text-sm font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mr-3 shrink-0"></span>
                        {sidebarMake} Codes
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
        )}
        </div>
      </main>
    </div>
  );
}
