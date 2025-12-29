import { describe, it, expect } from 'vitest';
import { createPlayerSchema, updatePlayerSchema } from '..';
import { makePlayerPayload } from '../../../tests/factories/player';

describe('player schema', () => {
  it('rejects empty names', () => {
    const result = createPlayerSchema.safeParse(makePlayerPayload({ name: '' }));
    expect(result.success).toBe(false);
  });

  it('rejects player numbers above 99', () => {
    const result = createPlayerSchema.safeParse(makePlayerPayload({ number: 120 }));
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric player numbers on update', () => {
    const result = updatePlayerSchema.safeParse({ number: 'not-a-number' });
    expect(result.success).toBe(false);
  });
});
