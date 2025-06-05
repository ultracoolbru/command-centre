import { useState, useEffect } from 'react';
import { useDataStore } from '@/lib/store';

const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

// Custom hook for API data fetching with MongoDB
import type { DataKey } from '@/lib/store';

export function useMongoData(collection: DataKey, query?: Record<string, any>, initialFetch = true) {
  const {
    setData,
    addItem,
    updateItem,
    removeItem,
    setLoading,
    setError
  } = useDataStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);

  // Fetch data from API
  const fetchData = async () => {
    setIsLoading(true);
    setLoading(collection, true);
    setErrorState(null);
    setError(collection, null);

    try {
      let url = `/api/${collection}`;
      if (query && Object.keys(query).length > 0) {
        const params = new URLSearchParams(query as any).toString();
        url += `?${params}`;
      }
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${collection}`);
      }

      const result = await response.json();
      setData(collection, result.data || []);
      return result.data;
    } catch (err) {
      const error = isError(err) ? err : new Error('An unknown error occurred');
      console.error(`Error fetching ${collection}:`, error);
      setErrorState(error.message);
      setError(collection, error.message);
      return [];
    } finally {
      setIsLoading(false);
      setLoading(collection, false);
    }
  };

  // Create new item
  const createItem = async (item: any) => {
    setIsLoading(true);
    setLoading(collection, true);
    setErrorState(null);
    setError(collection, null);

    try {
      const response = await fetch(`/api/${collection}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        throw new Error(`Failed to create ${collection} item`);
      }

      const result = await response.json();
      addItem(collection, result);
      return result;
    } catch (err) {
      const error = isError(err) ? err : new Error('An unknown error occurred');
      console.error(`Error creating ${collection} item:`, error);
      setErrorState(error.message);
      setError(collection, error.message);
      return null;
    } finally {
      setIsLoading(false);
      setLoading(collection, false);
    }
  };

  // Update existing item
  const updateItemById = async (id: string, item: any) => {
    setIsLoading(true);
    setLoading(collection, true);
    setErrorState(null);
    setError(collection, null);

    try {
      const response = await fetch(`/api/${collection}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        throw new Error(`Failed to update ${collection} item`);
      }

      const result = await response.json();
      updateItem(collection, id, result);
      return result;
    } catch (err) {
      const error = isError(err) ? err : new Error('An unknown error occurred');
      console.error(`Error updating ${collection} item:`, error);
      setErrorState(error.message);
      setError(collection, error.message);
      return null;
    } finally {
      setIsLoading(false);
      setLoading(collection, false);
    }
  };

  // Delete item
  const deleteItem = async (id: string) => {
    setIsLoading(true);
    setLoading(collection, true);
    setErrorState(null);
    setError(collection, null);

    try {
      const response = await fetch(`/api/${collection}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${collection} item`);
      }

      removeItem(collection, id);
      return true;
    } catch (err) {
      const error = isError(err) ? err : new Error('An unknown error occurred');
      console.error(`Error deleting ${collection} item:`, error);
      setErrorState(error.message);
      setError(collection, error.message);
      return false;
    } finally {
      setIsLoading(false);
      setLoading(collection, false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (initialFetch) {
      fetchData();
    }
  }, [collection, JSON.stringify(query)]);

  // Retrieve the current collection's data from the store
  const data = useDataStore((state) => state[collection] || []);

  return {
    data,
    isLoading,
    error,
    fetchData,
    createItem,
    updateItem: updateItemById,
    deleteItem,
  };
}

// Custom hook for Gemini AI features
export function useGeminiAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate insights
  const generateInsights = async (data: any, category: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data, category }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const result = await response.json();
      return result.insights;
    } catch (err) {
      const error = isError(err) ? err : new Error('An unknown error occurred');
      console.error('Error generating insights:', error);
      setError(error.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze sentiment
  const analyzeSentiment = async (text: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze sentiment');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const error = isError(err) ? err : new Error('An unknown error occurred');
      console.error('Error analyzing sentiment:', error);
      setError(error.message);
      return { sentiment: 'neutral', confidence: 0.5 };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    generateInsights,
    analyzeSentiment,
  };
}
