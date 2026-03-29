import { useCallback, useState } from 'react';
import type { ApiError } from '../core/apiError';

interface UseApiRequestResult<TData, TVariables> {
  data: TData | null;
  loading: boolean;
  error: ApiError | null;
  execute: (variables: TVariables) => Promise<TData | null>;
  reset: () => void;
}

// Hook dùng chung để quản lý trạng thái gọi API: data/loading/error.
export const useApiRequest = <TData, TVariables>(
  handler: (variables: TVariables) => Promise<TData>,
): UseApiRequestResult<TData, TVariables> => {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(
    async (variables: TVariables): Promise<TData | null> => {
      // Mỗi lần gọi mới sẽ reset lỗi cũ.
      setLoading(true);
      setError(null);

      try {
        const result = await handler(variables);
        setData(result);
        return result;
      } catch (caught) {
        const apiError = caught as ApiError;
        setError(apiError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handler],
  );

  const reset = useCallback(() => {
    // Reset tay khi cần dọn state ở UI.
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
};
