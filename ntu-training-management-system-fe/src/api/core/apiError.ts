import axios from 'axios';

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

interface LaravelErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

// Quy đổi mọi lỗi về một chuẩn để UI xử lý thống nhất.
export const toApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as LaravelErrorResponse | undefined;

    return {
      message: data?.message ?? error.message ?? 'Request failed',
      status: error.response?.status,
      errors: data?.errors,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: 'Unknown error' };
};
