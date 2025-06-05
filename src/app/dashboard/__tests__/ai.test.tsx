import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIPage from '@/app/dashboard/ai/page';

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
      { title: 'Productivity Insight', description: 'Your productivity increases on days with morning planning' }
    ])
  })
}));

// Mock the store
jest.mock('@/lib/store', () => ({
  useDataStore: () => ({
    aiInsights: [
      {
        id: '1',
        category: 'productivity',
        title: 'Task Completion Patterns',
        description: 'You complete 27% more tasks on days when you log your morning priorities before 9 AM.',
        date: new Date('2025-05-22')
      }
    ]
  })
}));

describe('AI Insights Page', () => {
  test('renders AI insights page with correct title', () => {
    render(<AIPage />);
    
    const title = screen.getByText('AI Insights');
    expect(title).toBeInTheDocument();
  });

  test('displays insights tab', () => {
    render(<AIPage />);
    
    const insightsTab = screen.getByText('Insights');
    expect(insightsTab).toBeInTheDocument();
  });

  test('displays ask Gemini tab', () => {
    render(<AIPage />);
    
    const askTab = screen.getByText('Ask Gemini');
    expect(askTab).toBeInTheDocument();
  });

  test('displays productivity insights', () => {
    render(<AIPage />);
    
    const productivitySection = screen.getByText('Productivity Insights');
    expect(productivitySection).toBeInTheDocument();
  });
});
