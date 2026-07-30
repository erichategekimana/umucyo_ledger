import { BaseService } from './base.service';
import { Notification, PaginatedResponse } from '@/types';

export class NotificationService extends BaseService {
  protected basePath = '';

  async listNotifications(params?: any): Promise<PaginatedResponse<Notification>> {
    return this.getPaginated<Notification>('/notifications/', params);
  }
}

export const notificationService = new NotificationService();