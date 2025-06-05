import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DailyPage from '@/app/dashboard/daily/page';

// Mock the hooks
jest.mock('@/lib/hooks', () => ({
  useMongoData: () => ({
    isLoading: false,
    error: null,
    fetchData: jest.fn(),
    createItem: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn()
  })
}));

// Mock the store
jest.mock('@/lib/store', () => ({
  useDataStore: () => ({
    dailyPlans: [
      {
        id: '1',
        date: new Date('2025-05-22'),
        priority1: 'Complete dashboard',
        priority2: 'Test modules',
        priority3: 'Deploy application',
        morningNotes: 'Focus on completing all modules',
        accomplishments: '',
        challenges: '',
        tomorrowFocus: '',
        reflectionNotes: ''
      }
    ]
  })
}));

describe('Daily Planner Page', () => {
  test('renders daily planner page with correct title', () => {
    render(<DailyPage />);
    
    const title = screen.getByText('Daily Planner & Review');
    expect(title).toBeInTheDocument();
  });

  test('displays morning priorities section', () => {
    render(<DailyPage />);
    
    const morningSection = screen.getByText('Morning Priorities');
    expect(morningSection).toBeInTheDocument();
  });

  test('displays evening review section', () => {
    render(<DailyPage />);
    
    const eveningSection = screen.getByText('Evening Review');
    expect(eveningSection).toBeInTheDocument();
  });
});
