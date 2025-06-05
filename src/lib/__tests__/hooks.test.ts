import '@testing-library/jest-dom';
import { useMongoData, useGeminiAI } from '@/lib/hooks';

// Mock fetch
global.fetch = jest.fn();

// Mock the store
jest.mock('@/lib/store', () => ({
  useDataStore: () => ({
    setData: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    setLoading: jest.fn(),
    setError: jest.fn()
  })
}));

describe('Custom Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useMongoData', () => {
    test('fetches data on initialization', async () => {
      // Mock successful fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: '1', name: 'Test' }] })
      });

      // Use the hook
      const { fetchData } = useMongoData('tasks', {});

      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalledWith('/api/tasks');
    });

    test('handles fetch errors', async () => {
      // Mock failed fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false
      });

      // Use the hook
      const { fetchData } = useMongoData('tasks', {});

      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalledWith('/api/tasks');
    });
  });

  describe('useGeminiAI', () => {
    test('generates insights', async () => {
      // Mock successful fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ insights: [{ title: 'Test Insight', description: 'Description' }] })
      });

      // Use the hook
      const { generateInsights } = useGeminiAI();
      const result = await generateInsights({ data: 'test' }, 'health');

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith('/api/gemini/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: { data: 'test' }, category: 'health' }),
      });

      // Verify result
      expect(result).toEqual([{ title: 'Test Insight', description: 'Description' }]);
    });

    test('analyzes sentiment', async () => {
      // Mock successful fetch response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sentiment: 'positive', confidence: 0.9 })
      });

      // Use the hook
      const { analyzeSentiment } = useGeminiAI();
      const result = await analyzeSentiment('I feel great today!');

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith('/api/gemini/sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'I feel great today!' }),
      });

      // Verify result
      expect(result).toEqual({ sentiment: 'positive', confidence: 0.9 });
    });
  });
});
