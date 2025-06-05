import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the store types
interface AuthState {
  user: any | null;
  setUser: (user: any | null) => void;
}

export type DataKey = 'dailyPlans' | 'tasks' | 'goals' | 'healthLogs' | 'journalEntries' | 'violtPhases' | 'violtTasks' | 'bulletEntries' | 'collections' | 'echoTasks' | 'reminders' | 'aiInsights';

interface DataState {
  dailyPlans: any[];
  tasks: any[];
  goals: any[];
  healthLogs: any[];
  journalEntries: any[];
  violtPhases: any[];
  violtTasks: any[];
  bulletEntries: any[];
  collections: any[];
  echoTasks: any[];
  reminders: any[];
  aiInsights: any[];

  // CRUD operations
  setData: (key: DataKey, data: any[]) => void;
  addItem: (key: DataKey, item: any) => void;
  updateItem: (key: DataKey, id: string, item: any) => void;
  removeItem: (key: DataKey, id: string) => void;

  // Loading states
  loading: Record<string, boolean>;
  setLoading: (key: DataKey, isLoading: boolean) => void;

  // Error states
  errors: Record<string, string | null>;
  setError: (key: DataKey, error: string | null) => void;

  // Clear all data (for logout)
  clearAllData: () => void;
}

// Create the auth store
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

// Create the data store
export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      // Data collections
      dailyPlans: [],
      tasks: [],
      goals: [],
      healthLogs: [],
      journalEntries: [],
      violtPhases: [],
      violtTasks: [],
      bulletEntries: [],
      collections: [],
      echoTasks: [],
      reminders: [],
      aiInsights: [],

      // Loading and error states
      loading: {},
      errors: {},

      // CRUD operations
      setData: (key: DataKey, data: any[]) => set((state) => ({ ...state, [key]: data })),

      addItem: (key: DataKey, item: any) => set((state) => ({
        ...state,
        [key]: [...state[key], item],
      })),

      updateItem: (key: DataKey, id: string, item: any) => set((state) => ({
        ...state,
        [key]: state[key].map((i: any) =>
          i.id === id ? { ...i, ...item } : i
        ),
      })),

      removeItem: (key: DataKey, id: string) => set((state) => ({
        ...state,
        [key]: state[key].filter((i: any) => i.id !== id),
      })),

      // Loading state management
      setLoading: (key: DataKey, isLoading: boolean) => set((state) => ({
        ...state,
        loading: { ...state.loading, [key]: isLoading },
      })),

      // Error state management
      setError: (key: DataKey, error: string | null) => set((state) => ({
        ...state,
        errors: { ...state.errors, [key]: error },
      })),


      // Clear all data (for logout)
      clearAllData: () => set((state) => ({
        ...state,
        dailyPlans: [],
        tasks: [],
        goals: [],
        healthLogs: [],
        journalEntries: [],
        violtPhases: [],
        violtTasks: [],
        bulletEntries: [],
        collections: [],
        echoTasks: [],
        reminders: [],
        aiInsights: [],
        loading: {},
        errors: {},
      })),
    }),
    {
      name: 'data-storage',
      partialize: (state) => ({
        dailyPlans: state.dailyPlans,
        tasks: state.tasks,
        goals: state.goals,
        healthLogs: state.healthLogs,
        journalEntries: state.journalEntries,
        violtPhases: state.violtPhases,
        violtTasks: state.violtTasks,
        bulletEntries: state.bulletEntries,
        collections: state.collections,
        echoTasks: state.echoTasks,
        reminders: state.reminders,
        aiInsights: state.aiInsights,
      }),
    }
  )
);
