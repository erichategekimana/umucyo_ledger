import { BaseService } from './base.service';
import { User, PaginatedResponse } from '@/types';
import { ENDPOINTS } from './endpoints';

export class UserService extends BaseService {
  protected basePath = '';

  async getUsers(params?: any): Promise<PaginatedResponse<User>> {
    return this.getPaginated<User>(ENDPOINTS.USER.LIST, params);
  }

  async getUser(id: string): Promise<User> {
    return this.get<User>(ENDPOINTS.USER.DETAIL(id));
  }

  async changeRole(id: string, role: string): Promise<any> {
    return this.post(ENDPOINTS.USER.CHANGE_ROLE(id), { role });
  }
}

export const userService = new UserService();