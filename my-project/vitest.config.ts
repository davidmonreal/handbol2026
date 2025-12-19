import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts', 'tests/**/*.test.ts'],
    globalSetup: ['tests/utils/global-cleanup.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
