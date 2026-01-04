import { describe, it, expect } from 'vitest';
import { createPlayerSchema, updatePlayerSchema } from '..';
import { makePlayerPayload } from '../../../tests/factories/player';

describe('player schema', () => {
  it('rejects empty names', () => {
    const result = createPlayerSchema.safeParse(makePlayerPayload({ name: '' }));
    expect(result.success).toBe(false);
  });

  it('accepts updates without handedness', () => {
    const result = updatePlayerSchema.safeParse({ name: 'test-Alex' });
    expect(result.success).toBe(true);
  });
});
