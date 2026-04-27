import type { AxiosRequestConfig } from 'axios';
import { httpClient } from '../config/httpClient';
import { toApiError } from './apiError';

// Hàm GET tổng quát: trả dữ liệu đã typed và chuẩn hóa lỗi.
export const apiGet = async <TResponse>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<TResponse> => {
  try {
    const response = await httpClient.get<TResponse>(url, config);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

// Hàm POST tổng quát: dùng cho login/logout/change-password...
export const apiPost = async <TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
): Promise<TResponse> => {
  try {
    const response = await httpClient.post<TResponse>(url, body, config);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const apiPut = async <TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
): Promise<TResponse> => {
  try {
    const response = await httpClient.put<TResponse>(url, body, config);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const apiDelete = async <TResponse>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<TResponse> => {
  try {
    const response = await httpClient.delete<TResponse>(url, config);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};
