import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { TaskList } from '../TaskList';
import { AuthProvider } from '@/lib/auth-context';

// Mock the useMongoData hook
jest.mock('@/lib/hooks', () => ({
  useMongoData: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
    refresh: jest.fn(),
  })),
}));

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <MantineProvider>
      <Notifications />
      <AuthProvider>
        {children}
      </AuthProvider>
    </MantineProvider>
  );
};

describe('TaskList', () => {
  it('renders loading state', () => {
    const { useMongoData } = require('@/lib/hooks');
    useMongoData.mockImplementation(() => ({
      data: [],
      isLoading: true,
      error: null,
    }));

    render(
      <AllTheProviders>
        <TaskList />
      </AllTheProviders>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders tasks', async () => {
    const mockTasks = [
      { _id: '1', title: 'Test Task 1', completed: false },
      { _id: '2', title: 'Test Task 2', completed: true },
    ];

    const { useMongoData } = require('@/lib/hooks');
    useMongoData.mockImplementation(() => ({
      data: mockTasks,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    }));

    render(
      <AllTheProviders>
        <TaskList />
      </AllTheProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    });
  });

  it('shows error message', () => {
    const { useMongoData } = require('@/lib/hooks');
    useMongoData.mockImplementation(() => ({
      data: [],
      isLoading: false,
      error: new Error('Failed to fetch tasks'),
    }));

    render(
      <AllTheProviders>
        <TaskList />
      </AllTheProviders>
    );

    expect(screen.getByText('Error loading tasks')).toBeInTheDocument();
  });
});
