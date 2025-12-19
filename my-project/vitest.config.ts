import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts', 'tests/**/*.test.ts'],
    setupFiles: ['tests/utils/cleanup-test-hook.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
