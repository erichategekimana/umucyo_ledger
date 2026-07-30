import { BaseService } from './base.service';
import { Cooperative, CooperativeStaff, Farmer } from '@/types';

export class CooperativeService extends BaseService {
  protected basePath = '';

  // Cooperatives
  async listCooperatives(params?: any): Promise<Cooperative[]> {
    return this.get<Cooperative[]>('/cooperatives/', params);
  }

  async getCooperative(id: string): Promise<Cooperative> {
    return this.get<Cooperative>(`/cooperatives/${id}/`);
  }

  // Staff
  async listStaff(params?: any): Promise<CooperativeStaff[]> {
    return this.get<CooperativeStaff[]>('/staff/', params);
  }

  // Farmers
  async listFarmers(params?: any): Promise<Farmer[]> {
    return this.get<Farmer[]>('/farmers/', params);
  }

  async getFarmer(id: string): Promise<Farmer> {
    return this.get<Farmer>(`/farmers/${id}/`);
  }

  async getFarmerBalance(id: string): Promise<any> {
    return this.get<any>(`/farmers/${id}/balance/`);
  }
}

export const cooperativeService = new CooperativeService();