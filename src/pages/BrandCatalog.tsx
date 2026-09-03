import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { HomeHeader } from '../components/HomeHeader';
import { NHTSASafetyHub } from '../components/NHTSASafetyHub';
import { OEMPartsCatalog } from '../components/OEMPartsCatalog';
import { getBrandColor } from '../lib/brandColors';
import { fetchModelsForMake } from '../services/nhtsaService';

export default function BrandCatalog() {
  const { make, model: paramModel, year: paramYear } = useParams<{ make: string, model?: string, year?: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'parts' | 'recalls' | 'investigations' | 'complaints'>('recalls');
  
  const selectedModel = paramModel ? decodeURIComponent(paramModel) : null;
  const selectedYear = paramYear || '';

  const safeMake = make ? make.charAt(0).toUpperCase() + make.slice(1).toLowerCase() : '';

  const { data: models = [], isLoading } = useQuery({
    queryKey: ['models', safeMake],
    queryFn: () => fetchModelsForMake(safeMake),
    enabled: !!safeMake
  });

  const uniqueModels = Array.from(new Set(models.map((m: any) => m.Model_Name))).sort();
  const filteredModels = uniqueModels.filter((model: any) => 
    model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans overflow-x-hidden">
      <Helmet>
        <title>{safeMake} Models & Safety Data | Repyr</title>
        <meta name="description" content={"Browse " + safeMake + " models, view safety data, recalls, and consumer complaints."} />
      </Helmet>
      
      <HomeHeader />



      <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        <div className="mb-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4">
            {safeMake} <span className="text-primary">Catalog</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select a model to view safety data, common issues, and the Lemon Checker score.
          </p>
        </div>

        {!selectedModel ? (
          <div className="w-full max-w-4xl mx-auto">
            <div className="relative mb-8">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder={"Search " + safeMake + " models..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-11 pr-4 py-4 bg-card border border-border rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-lg shadow-sm"
              />
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4"
              >
                {filteredModels.map((modelName: any) => {
                  const brandColor = getBrandColor(safeMake);
                  return (
                  <button
                    key={modelName}
                    onClick={() => navigate(`/cars/${make}/${encodeURIComponent(modelName)}`)}
                    className="relative flex flex-col items-center justify-center p-6 bg-card border border-border rounded-xl transition-all cursor-pointer shadow-sm overflow-hidden group hover:-translate-y-1 hover:shadow-md"
                    style={{ '--brand-color': brandColor } as React.CSSProperties}
                  >
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                      style={{ backgroundColor: brandColor }}
                    />
                    
                    <div 
                      className="absolute inset-0 border-2 border-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-all duration-300 pointer-events-none"
                      style={{ borderColor: brandColor }}
                    />

                    <div className="flex flex-col items-center z-10 w-full">
                      <span 
                        className="font-black text-xl sm:text-2xl tracking-tighter uppercase transition-colors truncate w-full text-center text-foreground group-hover:text-[color:var(--brand-color)]"
                      >
                        {modelName}
                      </span>
                    </div>
                  </button>
                  );
                })}
                {filteredModels.length === 0 && (
                  <div className="col-span-full py-12 text-center text-muted-foreground">
                    No models found matching "{searchQuery}"
                  </div>
                )}
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="flex flex-col sm:flex-row justify-between items-center bg-card border border-border rounded-2xl p-6 mb-8 shadow-sm">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-2xl font-black tracking-tight">{safeMake} {selectedModel}</h2>
                <button 
                  onClick={() => navigate(`/cars/${make}`)}
                  className="text-primary text-sm font-semibold hover:underline cursor-pointer"
                >
                  Change Model
                </button>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Model Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => navigate(`/cars/${make}/${encodeURIComponent(selectedModel!)}/${e.target.value}`)}
                  className="bg-background border border-input rounded-xl px-4 py-2 text-foreground text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 w-32 cursor-pointer"
                >
                  <option value="" disabled>Select Year</option>
                  {Array.from({ length: 35 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedYear ? (
              <div className="mt-8">
                <div className="flex flex-wrap items-center gap-2 mb-8 bg-muted/50 p-1.5 rounded-2xl w-fit mx-auto sm:mx-0">
                  
                  <button
                    onClick={() => setActiveTab('parts')}
                    className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                      activeTab === 'parts' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    OEM Parts
                  </button>
                  <button
                    onClick={() => setActiveTab('recalls')}
                    className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                      activeTab === 'recalls' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Recalls
                  </button>
                  <button
                    onClick={() => setActiveTab('investigations')}
                    className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                      activeTab === 'investigations' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Investigations
                  </button>
                  <button
                    onClick={() => setActiveTab('complaints')}
                    className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                      activeTab === 'complaints' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Complaints
                  </button>
                </div>

                {activeTab === 'parts' ? (
                  <OEMPartsCatalog make={safeMake} model={selectedModel} year={selectedYear} />
                ) : (
                  <NHTSASafetyHub make={safeMake} model={selectedModel} year={selectedYear} activeTab={activeTab} />
                )}
              </div>
            ) : (
              <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xl font-bold mb-6">Select a Year for {selectedModel}</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 sm:gap-4">
                  {Array.from({ length: 35 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <button
                      key={year}
                      onClick={() => navigate(`/cars/${make}/${encodeURIComponent(selectedModel!)}/${year}`)}
                      className="flex flex-col items-center justify-center py-5 px-2 bg-card border border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md text-center group"
                    >
                      <span className="font-bold text-xl group-hover:text-primary transition-colors">{year}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
        
      </div>
    </div>
  );
}
