import { BaseService } from './base.service';
import { Notification, PaginatedResponse } from '@/types';

export class NotificationService extends BaseService {
  protected basePath = '';

  async listNotifications(params?: any): Promise<PaginatedResponse<Notification>> {
    return this.getPaginated<Notification>('/notifications/', params);
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.patch<Notification>(`/notifications/${id}/mark_read/`);
  }
}

export const notificationService = new NotificationService();