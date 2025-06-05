import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import JournalPage from '@/app/dashboard/journal/page';

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
    analyzeSentiment: jest.fn().mockResolvedValue({ sentiment: 'positive', confidence: 0.9 }),
    generateInsights: jest.fn()
  })
}));

// Mock the store
jest.mock('@/lib/store', () => ({
  useDataStore: () => ({
    journalEntries: [
      {
        id: '1',
        date: new Date('2025-05-22'),
        title: 'Test Journal Entry',
        content: 'This is a test journal entry with positive sentiment.',
        mood: 'positive',
        tags: ['test', 'journal'],
        sentiment: {
          score: 0.8,
          label: 'positive'
        }
      }
    ]
  })
}));

describe('Journal Page', () => {
  test('renders journal page with correct title', () => {
    render(<JournalPage />);
    
    const title = screen.getByText('Emotion & Thought Journal');
    expect(title).toBeInTheDocument();
  });

  test('displays journal entry form', () => {
    render(<JournalPage />);
    
    const titleInput = screen.getByLabelText(/title/i);
    const contentTextarea = screen.getByLabelText(/entry/i);
    expect(titleInput).toBeInTheDocument();
    expect(contentTextarea).toBeInTheDocument();
  });

  test('displays existing journal entries', () => {
    render(<JournalPage />);
    
    const entryTitle = screen.getByText('Test Journal Entry');
    expect(entryTitle).toBeInTheDocument();
  });
});
