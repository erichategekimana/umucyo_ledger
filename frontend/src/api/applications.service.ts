import { BaseService } from './base.service';
import { ENDPOINTS } from './endpoints';
import { PaginatedResponse } from '@/types';

export interface VetApplication {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  national_id: string;
  is_rwandan: boolean;
  status: string;
  created_at: string;
  // File URLs
  national_id_document: string | null;
  degree_certificate: string | null;
  transcripts: string | null;
  proof_of_internship: string | null;
  rcvd_certificate: string | null;
  annual_practicing_license: string | null;
}

export class ApplicationsService extends BaseService {
  protected basePath = '';

  async submitVetApplication(formData: FormData): Promise<VetApplication> {
    return this.postFormData<VetApplication>(ENDPOINTS.VET_APPLICATIONS.LIST, formData);
  }

  async listVetApplications(params?: any): Promise<PaginatedResponse<VetApplication>> {
    return this.getPaginated<VetApplication>(ENDPOINTS.VET_APPLICATIONS.LIST, params);
  }

  async approveVetApplication(id: string): Promise<any> {
    return this.post(ENDPOINTS.VET_APPLICATIONS.APPROVE(id));
  }

  async declineVetApplication(id: string): Promise<any> {
    return this.post(ENDPOINTS.VET_APPLICATIONS.DECLINE(id));
  }
}

export const applicationsService = new ApplicationsService();
