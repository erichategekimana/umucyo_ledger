export interface BatchTotal {
  id: string;
  cooperative: string;
  cooperative_name: string;
  crop_type: string;
  season_label: string;
  total_weight_kg: number;
  status: 'OPEN' | 'LOCKED';
  locked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CropDelivery {
  id: string;
  cooperative: string;
  cooperative_name: string;
  farmer: string;
  farmer_name: string;
  officer: string;
  officer_username: string;
  batch: string;
  crop_type: string;
  weight_kg: number;
  status: string;
  dropoff_time: string;
  created_at: string;
}

export interface AdjustmentLog {
  id: string;
  original_delivery: string;
  corrected_weight_kg: number;
  reason: string;
  approved_by: string;
  approved_by_username: string;
  created_at: string;
}

export interface DiscrepancyFlag {
  id: string;
  batch: string;
  batch_details: {
    cooperative: string;
    crop_type: string;
    season_label: string;
  };
  invoice_weight_kg: number;
  ledger_weight_kg: number;
  drift_kg: number;
  resolved: boolean;
  created_at: string;
  updated_at: string;
}