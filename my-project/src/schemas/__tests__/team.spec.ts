import { describe, it, expect } from 'vitest';
import { assignPlayerSchema, updatePlayerPositionSchema } from '..';

describe('team schema', () => {
  it('rejects invalid positions for assignment', () => {
    const result = assignPlayerSchema.safeParse({ playerId: 'test-player', position: 999 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid positions for updates', () => {
    const result = updatePlayerPositionSchema.safeParse({ position: -1 });
    expect(result.success).toBe(false);
  });
});
