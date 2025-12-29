import { describe, it, expect } from 'vitest';
import { batchPlayersSchema, batchPlayersWithTeamSchema } from '..';
import { makePlayerPayload } from '../../../tests/factories/player';

describe('player batch schema', () => {
  it('rejects empty player arrays', () => {
    const result = batchPlayersSchema.safeParse({ players: [] });
    expect(result.success).toBe(false);
  });

  it('rejects missing team identifiers', () => {
    const result = batchPlayersWithTeamSchema.safeParse({
      players: [makePlayerPayload()],
      teamId: '',
    });
    expect(result.success).toBe(false);
  });
});
