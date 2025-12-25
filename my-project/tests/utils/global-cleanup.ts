import { cleanupTestData } from './cleanup-test-data';

export default async function setup() {
  await cleanupTestData();
  return async () => {
    await cleanupTestData();
  };
}
