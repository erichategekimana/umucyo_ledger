export interface AnomalyReport {
  id: string;
  cooperative: string;
  cooperative_name: string;
  reported_by: string;
  reported_by_username: string;
  sector: string;
  latitude: number;
  longitude: number;
  category: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resolved: boolean;
  created_at: string;
  updated_at: string;
}