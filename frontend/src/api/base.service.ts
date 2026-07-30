import apiClient from './client';
import { AxiosRequestConfig } from 'axios';
import { PaginatedResponse } from '../types/api';

export abstract class BaseService {
  protected abstract basePath: string;

  protected async get<T>(url: string = '', config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.get<T>(`${this.basePath}${url}`, config);
    return response.data;
  }

  protected async post<T>(url: string = '', data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.post<T>(`${this.basePath}${url}`, data, config);
    return response.data;
  }

  protected async put<T>(url: string = '', data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.put<T>(`${this.basePath}${url}`, data, config);
    return response.data;
  }

  protected async patch<T>(url: string = '', data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.patch<T>(`${this.basePath}${url}`, data, config);
    return response.data;
  }

  protected async delete<T>(url: string = '', config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.delete<T>(`${this.basePath}${url}`, config);
    return response.data;
  }

    protected async get<T>(url: string = '', config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.get<T>(`${this.basePath}${url}`, config);
    return response.data;
  }

  protected async getPaginated<T>(url: string = '', params?: any, config?: AxiosRequestConfig): Promise<PaginatedResponse<T>> {
    const response = await apiClient.get<PaginatedResponse<T>>(`${this.basePath}${url}`, { ...config, params });
    return response.data;
  }
}