/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  globalSetup: '<rootDir>/tests/integration/globalSetup.ts',
  // Integration tests share one Postgres test database, so run files serially
  maxWorkers: 1,
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts'],
};
