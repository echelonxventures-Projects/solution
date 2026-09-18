module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@stores/(.*)$': '<rootDir>/src/stores/$1',
    '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
  },
};
