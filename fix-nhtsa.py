code = '''
import { supabase } from './supabase';

export interface NHTSARecall {
  NHTSACampaignNumber?: string;
  ReportReceivedDate?: string;
  Component?: string;
  Summary?: string;
  Consequence?: string;
  Remedy?: string;
}

export interface NHTSAInvestigation {
  NHTSAActionNumber?: string;
  OpenedDate?: string;
  investigationStatus?: string;
  subject?: string;
  components?: string;
  summary?: string;
}

export interface NHTSAComplaint {
  odiNumber?: string;
  dateComplaintFiled?: string;
  crash?: boolean | string;
  fire?: boolean | string;
  components?: string;
  summary?: string;
}

const NHTSA_API_BASE = 'https://api.nhtsa.gov';

/** Helper to fetch from NHTSA with Supabase fallback caching */
async function fetchWithCache(cacheKey: string, fetcher: () => Promise<any>) {
  try {
    // 1. Check Supabase Cache first
    const { data: cached } = await supabase
      .from('nhtsa_cache')
      .select('data')
      .eq('cache_key', cacheKey)
      .single();

    if (cached?.data) {
      console.log('? Using cached NHTSA data for:', cacheKey);
      return cached.data;
    }
  } catch (error) {
    // Ignore cache read errors and proceed to fetch
  }

  // 2. Fetch fresh from NHTSA API
  console.log('?? Fetching fresh NHTSA data for:', cacheKey);
  const freshData = await fetcher();

  // 3. Save to Supabase (Fire and forget)
  if (freshData) {
    supabase.from('nhtsa_cache').upsert({
      cache_key: cacheKey,
      data: freshData,
      updated_at: new Date().toISOString()
    }, { onConflict: 'cache_key' }).then(({ error }) => {
      if (error) console.error('Cache save error:', error);
    });
  }

  return freshData;
}

export async function fetchRecalls(make: string, model: string, year: string) {
  const cacheKey = ecalls___.toLowerCase();
  
  return fetchWithCache(cacheKey, async () => {
    try {
      const url = NHTSA_API_BASE + '/recalls/recallsByVehicle?make=' + encodeURIComponent(make) + '&model=' + encodeURIComponent(model) + '&modelYear=' + encodeURIComponent(year);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch recalls');
      return await res.json();
    } catch (error) {
      console.error('Error fetching recalls:', error);
      return { Count: 0, results: [] };
    }
  });
}

export async function fetchComplaints(make: string, model: string, year: string) {
  const cacheKey = complaints___.toLowerCase();
  
  return fetchWithCache(cacheKey, async () => {
    try {
      const url = NHTSA_API_BASE + '/complaints/complaintsByVehicle?make=' + encodeURIComponent(make) + '&model=' + encodeURIComponent(model) + '&modelYear=' + encodeURIComponent(year);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch complaints');
      return await res.json();
    } catch (error) {
      console.error('Error fetching complaints:', error);
      return { Count: 0, results: [] };
    }
  });
}

export async function fetchInvestigations(make: string, model: string, year: string) {
  const cacheKey = investigations___.toLowerCase();
  
  return fetchWithCache(cacheKey, async () => {
    try {
      const url = NHTSA_API_BASE + '/SafetyIssues/ByVehicle?make=' + encodeURIComponent(make) + '&model=' + encodeURIComponent(model) + '&year=' + encodeURIComponent(year) + '&issueType=i';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch investigations');
      return await res.json();
    } catch (error) {
      console.error('Error fetching investigations:', error);
      return { Count: 0, results: [] };
    }
  });
}

export async function fetchModelsForMake(make: string) {
  const cacheKey = models_.toLowerCase();
  
  return fetchWithCache(cacheKey, async () => {
    try {
      const url = 'https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/' + encodeURIComponent(make) + '?format=json';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch models');
      const data = await res.json();
      return data.Results || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  });
}
'''

with open('src/services/nhtsaService.ts', 'w', encoding='utf-8') as f:
    f.write(code.strip())
