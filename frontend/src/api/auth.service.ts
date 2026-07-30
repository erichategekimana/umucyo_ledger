import { BaseService } from './base.service';
import { ENDPOINTS } from './endpoints';
import { LoginRequest, RegisterRequest, TokenResponse, User } from '@/types';

export class AuthService extends BaseService {
  protected basePath = '';

  async login(credentials: LoginRequest): Promise<TokenResponse> {
    return this.post<TokenResponse>(ENDPOINTS.AUTH.TOKEN, credentials);
  }

  async refresh(refreshToken: string): Promise<{ access: string }> {
    return this.post<{ access: string }>(ENDPOINTS.AUTH.REFRESH, { refresh: refreshToken });
  }

  async register(data: RegisterRequest): Promise<User> {
    return this.post<User>(ENDPOINTS.AUTH.REGISTER, data);
  }

  async getProfile(): Promise<User> {
    return this.get<User>(ENDPOINTS.USER.ME);
  }
}

export const authService = new AuthService();