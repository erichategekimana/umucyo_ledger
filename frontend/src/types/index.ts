export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'COLLECTION_OFFICER' | 'VETERINARIAN' | 'FARMER';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  phone_number: string;
  preferred_language: 'en' | 'rw';
}

export interface Cooperative {
  id: string;
  name: string;
  rca_registration_no: string;
  district: string;
  sector: string;
}

export interface Farmer {
  id: string;
  national_id: string;
  full_name: string;
  phone_number: string;
  district: string;
  total_season_kg?: number;
}

export interface BatchTotal {
  id: string;
  cooperative: string;
  crop_type: string;
  season_label: string;
  total_weight_kg: number;
  status: 'OPEN' | 'LOCKED' | 'SOLD';
  locked_at?: string;
}

export interface CropDelivery {
  id: string;
  cooperative: string;
  farmer: string;
  officer: string;
  batch?: string;
  crop_type: string;
  weight_kg: number;
  dropoff_time: string;
}

export interface RevenueDistribution {
  id: string;
  sale: string;
  farmer: string;
  farmer_name?: string;
  farmer_phone?: string;
  contribution_kg: number;
  share_percentage: number;
  payout_rwf: number;
  payment_status: 'PENDING' | 'PAID' | 'FAILED';
  disbursement_ref?: string;
  disbursed_at?: string;
}

export interface BulkSale {
  id: string;
  batch: string;
  batch_details?: {
    cooperative: string;
    crop_type: string;
    season_label: string;
    total_weight_kg: number;
    status: string;
  };
  buyer_name: string;
  sale_price_rwf: number;
  bank_transfer_ref: string;
  verified: boolean;
  recorded_by_username?: string;
  distributions?: RevenueDistribution[];
  created_at: string;
}

export interface AnomalyReport {
  id: string;
  cooperative: string;
  reported_by: string;
  sector: string;
  latitude?: number;
  longitude?: number;
  category: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resolved: boolean;
  created_at: string;
}
