import { BaseService } from './base.service';
import { BatchTotal, CropDelivery, AdjustmentLog, DiscrepancyFlag } from '@/types';

export class HarvestService extends BaseService {
  protected basePath = '';

  // Batches
  async listBatches(params?: any): Promise<BatchTotal[]> {
    return this.get<BatchTotal[]>('/batches/', params);
  }

  async lockBatch(id: string): Promise<BatchTotal> {
    return this.post<BatchTotal>(`/batches/${id}/lock/`);
  }

  async flagDiscrepancy(id: string, invoiceWeightKg: number): Promise<{ flagged: boolean; ledger_weight_kg: number; invoice_weight_kg: number }> {
    return this.post<{ flagged: boolean; ledger_weight_kg: number; invoice_weight_kg: number }>(
      `/batches/${id}/flag_discrepancy/`,
      { invoice_weight_kg: invoiceWeightKg }
    );
  }

  // Deliveries
  async listDeliveries(params?: any): Promise<CropDelivery[]> {
    return this.get<CropDelivery[]>('/deliveries/', params);
  }

  async createDelivery(data: any): Promise<CropDelivery> {
    return this.post<CropDelivery>('/deliveries/', data);
  }

  // Adjustments
  async listAdjustments(params?: any): Promise<AdjustmentLog[]> {
    return this.get<AdjustmentLog[]>('/adjustments/', params);
  }

  // Discrepancies
  async listDiscrepancies(params?: any): Promise<DiscrepancyFlag[]> {
    return this.get<DiscrepancyFlag[]>('/discrepancies/', params);
  }

  async resolveDiscrepancy(id: string): Promise<DiscrepancyFlag> {
    return this.post<DiscrepancyFlag>(`/discrepancies/${id}/resolve/`);
  }
}

export const harvestService = new HarvestService();