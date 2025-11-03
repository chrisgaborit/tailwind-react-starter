module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/agents_v2', '<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: { 
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testTimeout: 240000, // 4 minutes default for all tests (DirectorAgent pipeline can be slow)
  maxWorkers: 1, // run tests sequentially instead of parallel to avoid OpenAI rate limits
  testSequencer: './jest.sequencer.js', // deterministic test order
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json'
    }
  }
};
