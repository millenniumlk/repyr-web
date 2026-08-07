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
