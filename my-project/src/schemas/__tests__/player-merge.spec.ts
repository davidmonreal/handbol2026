import { describe, it, expect } from 'vitest';
import { mergePlayerSchema } from '..';
import { makePlayerPayload } from '../../../tests/factories/player';

describe('player merge schema', () => {
  it('rejects missing old player identifiers', () => {
    const result = mergePlayerSchema.safeParse({
      oldPlayerId: '',
      newPlayerData: makePlayerPayload(),
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing new player data', () => {
    const result = mergePlayerSchema.safeParse({
      oldPlayerId: 'test-old-player',
      newPlayerData: {},
    });
    expect(result.success).toBe(false);
  });
});
