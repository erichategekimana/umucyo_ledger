import { BaseService } from './base.service';
import { USSDLog, PaginatedResponse } from '@/types';

export class USSDService extends BaseService {
  protected basePath = '';

  async listUSSDLogs(params?: any): Promise<PaginatedResponse<USSDLog>> {
    return this.getPaginated<USSDLog>('/ussd/logs/', params);
  }

  async listLogs(params?: any): Promise<PaginatedResponse<USSDLog>> {
    return this.listUSSDLogs(params);
  }
}

export const ussdService = new USSDService();
