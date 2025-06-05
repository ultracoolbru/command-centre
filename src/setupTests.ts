import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Mock Web Crypto API
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder as any;
  global.TextDecoder = TextDecoder as any;
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  usePathname() {
    return '';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
}));

// Mock MongoDB
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => Promise.resolve({
    db: () => ({
      collection: jest.fn().mockReturnThis(),
      find: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'test-id' }),
      updateOne: jest.fn().mockResolvedValue({ matchedCount: 1 }),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    }),
  })),
}));
