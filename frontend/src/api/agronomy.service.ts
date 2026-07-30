import { BaseService } from './base.service';
import { AnomalyReport, PaginatedResponse } from '@/types';

export class AgronomyService extends BaseService {
  protected basePath = '';

  async listAnomalies(params?: any): Promise<PaginatedResponse<AnomalyReport>> {
    return this.getPaginated<AnomalyReport>('/anomalies/', params);
  }

  async createAnomaly(data: any): Promise<AnomalyReport> {
    return this.post<AnomalyReport>('/anomalies/', data);
  }

  async resolveAnomaly(id: string): Promise<AnomalyReport> {
    return this.post<AnomalyReport>(`/anomalies/${id}/resolve/`);
  }

  async updateAnomaly(id: string, data: any): Promise<AnomalyReport> {
    return this.put<AnomalyReport>(`/anomalies/${id}/`, data);
  }

  async getAnomaly(id: string): Promise<AnomalyReport> {
  return this.get<AnomalyReport>(`/anomalies/${id}/`);
}
}

export const agronomyService = new AgronomyService();