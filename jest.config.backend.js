/** @type {import('jest').Config} */
const config = {
  displayName: 'Backend Tests',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/backend/setup.ts'],
  testMatch: [
    '<rootDir>/tests/backend/**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/frontend/'
  ],
  collectCoverageFrom: [
    'server/**/*.{js,jsx,ts,tsx}',
    'lib/services/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/dist/**',
  ],
  coverageDirectory: '<rootDir>/coverage/backend',
  coverageReporters: ['text', 'lcov', 'html'],
  preset: 'ts-jest',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 30000,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true
}

module.exports = config