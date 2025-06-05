import { useState, useEffect, useCallback } from 'react';
import { cache } from '@/lib/cache';
import { notifications } from '@mantine/notifications';

interface UseCachedFetchOptions<T> {
  key: string;
  url: string;
  options?: RequestInit;
  ttl?: number; // Time to live in milliseconds
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useCachedFetch<T>({
  key,
  url,
  options = {},
  ttl = 5 * 60 * 1000, // 5 minutes default
  enabled = true,
  onSuccess,
  onError,
}: UseCachedFetchOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cachedData = cache.get<T>(key);
      if (cachedData) {
        setData(cachedData);
        onSuccess?.(cachedData);
        return;
      }

      // If not in cache, fetch from API
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Cache the response
      cache.set(key, responseData, ttl);
      
      setData(responseData);
      onSuccess?.(responseData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      onError?.(error);
      
      // Show error notification
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch data. Please try again later.',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  }, [key, url, options, ttl, enabled, onSuccess, onError]);

  const refetch = useCallback(() => {
    // Clear cache and refetch
    cache.delete(key);
    return fetchData();
  }, [key, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}
