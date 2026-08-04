import { BaseService } from './base.service';
import { BatchTotal, CropDelivery, AdjustmentLog, DiscrepancyFlag, CropPrice, PaginatedResponse } from '@/types';

export class HarvestService extends BaseService {
  protected basePath = '';

  // Crop Prices
  async listCropPrices(): Promise<CropPrice[]> {
    const resp = await this.get<PaginatedResponse<CropPrice> | CropPrice[]>('/crop-prices/');
    if (Array.isArray(resp)) return resp;
    return resp.results || [];
  }

  async updateCropPrice(id: string, pricePerKg: number): Promise<CropPrice> {
    return this.patch<CropPrice>(`/crop-prices/${id}/`, { price_per_kg: pricePerKg });
  }

  async createCropPrice(name: string, pricePerKg: number): Promise<CropPrice> {
    return this.post<CropPrice>('/crop-prices/', { name, price_per_kg: pricePerKg });
  }

  async bulkUpdateCropPrices(prices: { id?: string; name?: string; price_per_kg: number }[]): Promise<CropPrice[]> {
    return this.post<CropPrice[]>('/crop-prices/bulk_update/', { prices });
  }

  // Batches - use paginated
  async listBatches(params?: any): Promise<PaginatedResponse<BatchTotal>> {
    return this.getPaginated<BatchTotal>('/batches/', params);
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

  // Deliveries - paginated
  async listDeliveries(params?: any): Promise<PaginatedResponse<CropDelivery>> {
    return this.getPaginated<CropDelivery>('/deliveries/', params);
  }

  async createDelivery(data: any): Promise<CropDelivery> {
    return this.post<CropDelivery>('/deliveries/', data);
  }

  async approveDelivery(id: string): Promise<CropDelivery> {
    return this.post<CropDelivery>(`/deliveries/${id}/approve/`);
  }

  async declineDelivery(id: string): Promise<CropDelivery> {
    return this.post<CropDelivery>(`/deliveries/${id}/decline/`);
  }

  // Adjustments - paginated
  async listAdjustments(params?: any): Promise<PaginatedResponse<AdjustmentLog>> {
    return this.getPaginated<AdjustmentLog>('/adjustments/', params);
  }

  // Discrepancies - paginated
  async listDiscrepancies(params?: any): Promise<PaginatedResponse<DiscrepancyFlag>> {
    return this.getPaginated<DiscrepancyFlag>('/discrepancies/', params);
  }

  async resolveDiscrepancy(id: string): Promise<DiscrepancyFlag> {
    return this.post<DiscrepancyFlag>(`/discrepancies/${id}/resolve/`);
  }
}

export const harvestService = new HarvestService();