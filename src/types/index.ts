export interface Vehicle {
  id?: string;
  make: string;
  model: string;
  year?: string | number;
  mileage?: string | number;
  fuel_type?: string;
  transmission?: string;
  location?: string;
  category?: string;
  description?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DiagnosticProbability {
  cause: string;
  confidence_score: number;
  reasoning?: string;
  estimated_cost?: string;
}

export interface MaintenanceRecord {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  vehicle_id: string | null;
  service_date: string;
  service_type: string;
  description?: string;
  cost?: number;
  mileage?: number;
  photo_urls: string[];
  notes?: string;
}
