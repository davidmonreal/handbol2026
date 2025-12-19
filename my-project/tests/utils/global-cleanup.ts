import { cleanupTestData } from './cleanup-test-data';

export default async function setup() {
  return async () => {
    await cleanupTestData();
  };
}
