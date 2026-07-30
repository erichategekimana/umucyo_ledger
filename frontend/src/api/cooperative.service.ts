import { BaseService } from './base.service';
import { Cooperative, CooperativeStaff, Farmer, PaginatedResponse } from '@/types';

export class CooperativeService extends BaseService {
  protected basePath = '';

  // Cooperatives - paginated (but we might just list all)
  async listCooperatives(params?: any): Promise<PaginatedResponse<Cooperative>> {
    return this.getPaginated<Cooperative>('/cooperatives/', params);
  }

  async getCooperative(id: string): Promise<Cooperative> {
    return this.get<Cooperative>(`/cooperatives/${id}/`);
  }

  // Staff - paginated
  async listStaff(params?: any): Promise<PaginatedResponse<CooperativeStaff>> {
    return this.getPaginated<CooperativeStaff>('/staff/', params);
  }

  // Farmers - paginated
  async listFarmers(params?: any): Promise<PaginatedResponse<Farmer>> {
    return this.getPaginated<Farmer>('/farmers/', params);
  }

  async getFarmer(id: string): Promise<Farmer> {
    return this.get<Farmer>(`/farmers/${id}/`);
  }

  async getFarmerBalance(id: string): Promise<any> {
    return this.get<any>(`/farmers/${id}/balance/`);
  }

  async createCooperative(data: Partial<Cooperative>): Promise<Cooperative> {
  return this.post<Cooperative>('/cooperatives/', data);
}

async updateCooperative(id: string, data: Partial<Cooperative>): Promise<Cooperative> {
  return this.put<Cooperative>(`/cooperatives/${id}/`, data);
}

async getStaff(id: string): Promise<CooperativeStaff> {
  return this.get<CooperativeStaff>(`/staff/${id}/`);
}

async createStaff(data: any): Promise<CooperativeStaff> {
  return this.post<CooperativeStaff>('/staff/', data);
}

async updateStaff(id: string, data: any): Promise<CooperativeStaff> {
  return this.put<CooperativeStaff>(`/staff/${id}/`, data);
}
}

export const cooperativeService = new CooperativeService();