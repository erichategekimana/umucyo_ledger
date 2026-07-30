import { BaseService } from './base.service';
import { Notification } from '@/types';

export class NotificationService extends BaseService {
  protected basePath = '';

  async listNotifications(params?: any): Promise<Notification[]> {
    return this.get<Notification[]>('/notifications/', params);
  }

  // Since we only have read-only, we can't mark as read, but we can count
}

export const notificationService = new NotificationService();