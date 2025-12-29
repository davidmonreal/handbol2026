import { describe, it, expect } from 'vitest';
import { createMatchSchema, updateMatchSchema } from '..';

const makeMatchPayload = (overrides: Partial<Record<string, unknown>> = {}) => ({
  date: new Date('2024-01-01T00:00:00.000Z'),
  homeTeamId: 'test-home-team',
  awayTeamId: 'test-away-team',
  ...overrides,
});

describe('match schema', () => {
  it('rejects identical home and away teams', () => {
    const result = createMatchSchema.safeParse(makeMatchPayload({ awayTeamId: 'test-home-team' }));
    expect(result.success).toBe(false);
  });

  it('rejects invalid dates', () => {
    const result = createMatchSchema.safeParse(makeMatchPayload({ date: 'not-a-date' }));
    expect(result.success).toBe(false);
  });

  it('rejects negative scores on create', () => {
    const result = createMatchSchema.safeParse(makeMatchPayload({ homeScore: -1 }));
    expect(result.success).toBe(false);
  });

  it('rejects negative scores on update', () => {
    const result = updateMatchSchema.safeParse({ awayScore: -2 });
    expect(result.success).toBe(false);
  });
});
