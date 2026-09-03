code = '''
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
  crash?: string;
  fire?: string;
  components?: string;
  summary?: string;
}

const NHTSA_API_BASE = 'https://api.nhtsa.gov';

export async function fetchRecalls(make: string, model: string, year: string) {
  try {
    const url = NHTSA_API_BASE + '/recalls/recallsByVehicle?make=' + encodeURIComponent(make) + '&model=' + encodeURIComponent(model) + '&modelYear=' + encodeURIComponent(year);
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch recalls');
    return await res.json();
  } catch (error) {
    console.error('Error fetching recalls:', error);
    return { Count: 0, results: [] };
  }
}

export async function fetchComplaints(make: string, model: string, year: string) {
  try {
    const url = NHTSA_API_BASE + '/complaints/complaintsByVehicle?make=' + encodeURIComponent(make) + '&model=' + encodeURIComponent(model) + '&modelYear=' + encodeURIComponent(year);
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch complaints');
    return await res.json();
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return { Count: 0, results: [] };
  }
}

export async function fetchInvestigations(make: string, model: string, year: string) {
  try {
    const url = NHTSA_API_BASE + '/SafetyIssues/ByVehicle?make=' + encodeURIComponent(make) + '&model=' + encodeURIComponent(model) + '&year=' + encodeURIComponent(year) + '&issueType=i';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch investigations');
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching investigations:', error);
    return { Count: 0, results: [] };
  }
}

export async function fetchModelsForMake(make: string) {
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
}
'''

with open('src/services/nhtsaService.ts', 'w', encoding='utf-8') as f:
    f.write(code.strip())
