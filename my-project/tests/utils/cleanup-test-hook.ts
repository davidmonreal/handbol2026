import { afterAll } from 'vitest';
import { cleanupTestData } from './cleanup-test-data';

afterAll(async () => {
  await cleanupTestData();
});
