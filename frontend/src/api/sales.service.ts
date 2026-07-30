import { BaseService } from './base.service';
import { BulkSale, RevenueDistribution, AuditReport, PaginatedResponse } from '@/types';

export class SalesService extends BaseService {
  protected basePath = '';

  // Bulk Sales
  async listSales(params?: any): Promise<PaginatedResponse<BulkSale>> {
    return this.getPaginated<BulkSale>('/sales/', params);
  }

  async createSale(data: any): Promise<BulkSale> {
    return this.post<BulkSale>('/sales/', data);
  }

  async getSale(id: string): Promise<BulkSale> {
    return this.get<BulkSale>(`/sales/${id}/`);
  }

  // Revenue Distributions (Payouts)
  async listPayouts(params?: any): Promise<PaginatedResponse<RevenueDistribution>> {
    return this.getPaginated<RevenueDistribution>('/payouts/', params);
  }

  // Audit Report
  async getAuditReport(coopId: string, params?: { start_date?: string; end_date?: string }): Promise<AuditReport> {
    return this.get<AuditReport>(`/cooperatives/${coopId}/audit_report/`, { params });
  }
}

export const salesService = new SalesService();