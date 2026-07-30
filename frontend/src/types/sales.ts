export interface BulkSale {
  id: string;
  cooperative: string;
  cooperative_name: string;
  batch: string;
  batch_crop_type?: string;
  buyer: string;
  price_per_kg: number;
  total_weight_kg: number;
  total_amount: number;
  sale_date: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
}

export interface RevenueDistribution {
  id: string;
  sale: string;
  farmer: string;
  farmer_name: string;
  amount: number;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
}

export interface AuditReport {
  cooperative: string;
  cooperative_name: string;
  start_date: string;
  end_date: string;
  summary: {
    total_sales: number;
    total_revenue: number;
    total_payouts: number;
    pending_payouts: number;
  };
  sales: BulkSale[];
  payouts: RevenueDistribution[];
}