import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts', 'tests/**/*.test.ts'],
    globalSetup: ['tests/utils/global-cleanup.ts'],
    testTimeout: 20000,
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
