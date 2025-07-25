import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner-native';

interface UseApiOptions {
  showToastOnError?: boolean;
  initialLoading?: boolean;
}

/**
 * API 함수를 받아 로딩, 데이터, 에러 상태를 관리하는 커스텀 훅
 * @param apiFunction API를 호출하는 Promise 함수
 * @param options.showToastOnError 에러 발생 시 토스트 메시지 표시 여부 (기본값: true)
 * @param options.initialLoading 컴포넌트 마운트 시 자동으로 데이터를 불러올지 여부 (기본값: true)
 * @returns { data, loading, error, refetch }
 */
export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions = {}
) {
  const { showToastOnError = true, initialLoading = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (...args: any[]) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      const castedError = err as Error;
      setError(castedError);
      if (showToastOnError) {
        // 서버 에러 메시지가 있다면 표시, 없다면 일반 메시지
        const errorMessage = (err as any)?.response?.data?.message || '데이터를 불러오는데 실패했습니다.';
        toast.error(errorMessage);
      }
      // 에러를 다시 던져서 컴포넌트 레벨에서 추가 처리할 수 있도록 함
      throw castedError;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, showToastOnError]);

  useEffect(() => {
    if (initialLoading) {
      fetchData();
    }
  }, [fetchData, initialLoading]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
