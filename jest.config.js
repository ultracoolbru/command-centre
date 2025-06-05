const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@testing-library/jest-dom/extend-expect$': '<rootDir>/node_modules/@testing-library/jest-dom/extend-expect.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@mantine/(.*)$': '<rootDir>/node_modules/@mantine/$1',
  },
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleDirectories: ['node_modules', 'src'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json'
    }
  }
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
