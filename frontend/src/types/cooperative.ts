export interface Cooperative {
  id: string;
  name: string;
  rca_registration_no: string;
  sector: string;
  district: string;
  crop?: string;
  admin_first_name?: string;
  admin_last_name?: string;
  admin_phone?: string;
  certificate?: string;
  tin_certificate?: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface CooperativeStaff {
  id: string;
  user: string; // UUID
  user_details: {
    username: string;
    email: string;
    phone_number: string;
    role: string;
  };
  cooperative: string;
  cooperative_name: string;
  is_active: boolean;
  created_at: string;
}

export interface Farmer {
  id: string;
  user: string;
  cooperative: string;
  cooperative_name: string;
  national_id: string;
  full_name: string;
  phone_number: string;
  district: string;
  total_season_kg: number;
  status?: string;
  created_at: string;
  updated_at: string;
}