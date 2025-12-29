import { describe, it, expect } from 'vitest';
import { importPlayersImageSchema } from '..';

describe('import schema', () => {
  it('rejects invalid image payloads', () => {
    const result = importPlayersImageSchema.safeParse({ image: 'not-an-image' });
    expect(result.success).toBe(false);
  });
});
