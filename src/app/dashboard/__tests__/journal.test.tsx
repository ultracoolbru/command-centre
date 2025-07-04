import BulletJournalPage from '@/app/dashboard/bullet/page';
import { render } from '@/test-utils';
import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

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

describe('Bullet Journal Page', () => {
  test('renders bullet journal page with correct title', () => {
    render(<BulletJournalPage />);

    const title = screen.getByText('Journal');
    expect(title).toBeInTheDocument();
  });

  test('displays bullet journal entry form', () => {
    render(<BulletJournalPage />);

    // Check for tab navigation
    const addEntryTab = screen.getByText('Add Entry');
    expect(addEntryTab).toBeInTheDocument();
  });

  test('displays existing bullet journal entries', () => {
    render(<BulletJournalPage />);

    // Check for daily entries tab
    const dailyEntriesTab = screen.getByText('Daily Entries');
    expect(dailyEntriesTab).toBeInTheDocument();
  });
});
