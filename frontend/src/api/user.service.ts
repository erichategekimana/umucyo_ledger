import { BaseService } from './base.service';
import { USSDLog, PaginatedResponse } from '@/types';

export class USSDService extends BaseService {
  protected basePath = '';

  async listLogs(params?: any): Promise<PaginatedResponse<USSDLog>> {
    return this.getPaginated<USSDLog>('/ussd/logs/', params);
  }
}

export const ussdService = new USSDService();