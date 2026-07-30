import { User } from './user';

export interface LoginRequest {
  username: string; // can be email, phone, or username
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  phone_number: string;
  password: string;
  role: string;
  preferred_language?: 'rw' | 'en';
}

export interface TokenResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface ApiError {
  detail?: string;
  [key: string]: any;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}