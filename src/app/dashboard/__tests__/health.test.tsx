import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HealthPage from '@/app/dashboard/health/page';

// Mock the hooks
jest.mock('@/lib/hooks', () => ({
  useMongoData: () => ({
    isLoading: false,
    error: null,
    fetchData: jest.fn(),
    createItem: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn()
  }),
  useGeminiAI: () => ({
    isLoading: false,
    error: null,
    generateInsights: jest.fn().mockResolvedValue([
      { title: 'Sleep Pattern', description: 'Your sleep has been consistent' }
    ])
  })
}));

// Mock the store
jest.mock('@/lib/store', () => ({
  useDataStore: () => ({
    healthLogs: [
      {
        id: '1',
        date: new Date('2025-05-22'),
        mood: 8,
        energy: 7,
        pain: 2,
        sleep: 7.5,
        weight: 165,
        nutrition: ['vegetables', 'protein'],
        supplements: ['vitamin D', 'magnesium'],
        notes: 'Feeling good today'
      }
    ]
  })
}));

describe('Health Tracker Page', () => {
  test('renders health tracker page with correct title', () => {
    render(<HealthPage />);
    
    const title = screen.getByText('Health Tracker');
    expect(title).toBeInTheDocument();
  });

  test('displays health log form', () => {
    render(<HealthPage />);
    
    const moodInput = screen.getByLabelText(/mood/i);
    const energyInput = screen.getByLabelText(/energy/i);
    expect(moodInput).toBeInTheDocument();
    expect(energyInput).toBeInTheDocument();
  });

  test('displays health metrics section', () => {
    render(<HealthPage />);
    
    const metricsSection = screen.getByText('Health Metrics');
    expect(metricsSection).toBeInTheDocument();
  });
});
