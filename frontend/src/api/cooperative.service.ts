import { BaseService } from './base.service';
import { Cooperative, CooperativeStaff, Farmer, PaginatedResponse } from '@/types';
import { ENDPOINTS } from './endpoints';

export class CooperativeService extends BaseService {
  protected basePath = '';

  async listCooperatives(params?: any): Promise<PaginatedResponse<Cooperative>> {
    return this.getPaginated<Cooperative>(ENDPOINTS.COOPERATIVES.LIST, params);
  }

  async getApprovedCooperatives(district?: string): Promise<Cooperative[]> {
    return this.get<Cooperative[]>(ENDPOINTS.COOPERATIVES.APPROVED, { params: { district } });
  }

  async getCooperative(id: string): Promise<Cooperative> {
    return this.get<Cooperative>(ENDPOINTS.COOPERATIVES.DETAIL(id));
  }

  async createCooperative(data: FormData | Partial<Cooperative>): Promise<Cooperative> {
    if (data instanceof FormData) {
      return this.postFormData<Cooperative>(ENDPOINTS.COOPERATIVES.LIST, data);
    }
    return this.post<Cooperative>(ENDPOINTS.COOPERATIVES.LIST, data);
  }

  async approveCooperative(id: string): Promise<any> {
    return this.post(ENDPOINTS.COOPERATIVES.APPROVE(id));
  }

  async declineCooperative(id: string): Promise<any> {
    return this.post(ENDPOINTS.COOPERATIVES.DECLINE(id));
  }

  async updateCooperative(id: string, data: Partial<Cooperative>): Promise<Cooperative> {
    return this.put<Cooperative>(ENDPOINTS.COOPERATIVES.DETAIL(id), data);
  }

  async listFarmers(params?: any): Promise<PaginatedResponse<Farmer>> {
    return this.getPaginated<Farmer>(ENDPOINTS.FARMERS.LIST, params);
  }

  async getFarmer(id: string): Promise<Farmer> {
    return this.get<Farmer>(ENDPOINTS.FARMERS.DETAIL(id));
  }

  async approveFarmer(id: string): Promise<any> {
    return this.post(ENDPOINTS.FARMERS.APPROVE(id));
  }

  async declineFarmer(id: string): Promise<any> {
    return this.post(ENDPOINTS.FARMERS.DECLINE(id));
  }

  async getFarmerBalance(id: string): Promise<any> {
    return this.get<any>(`${ENDPOINTS.FARMERS.DETAIL(id)}balance/`);
  }

  async createFarmer(data: any): Promise<Farmer> {
    return this.post<Farmer>(ENDPOINTS.FARMERS.LIST, data);
  }

  async updateFarmer(id: string, data: any): Promise<Farmer> {
    return this.put<Farmer>(ENDPOINTS.FARMERS.DETAIL(id), data);
  }

  // Staff - paginated
  async listStaff(params?: any): Promise<PaginatedResponse<CooperativeStaff>> {
    return this.getPaginated<CooperativeStaff>('/staff/', params);
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