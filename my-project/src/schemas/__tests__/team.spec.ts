import { describe, it, expect } from 'vitest';
import { assignPlayerSchema, updatePlayerAssignmentSchema } from '..';

describe('team schema', () => {
  it('rejects invalid positions for assignment', () => {
    const result = assignPlayerSchema.safeParse({
      playerId: 'test-player',
      position: 999,
      number: 7,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing number for assignment', () => {
    const result = assignPlayerSchema.safeParse({ playerId: 'test-player', position: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid positions for updates', () => {
    const result = updatePlayerAssignmentSchema.safeParse({ position: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects empty updates', () => {
    const result = updatePlayerAssignmentSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
