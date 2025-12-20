import { describe, it, expect } from 'vitest';
import {
  createGameEventSchema,
  EVENT_TYPES,
  SHOT_SUBTYPES,
  TURNOVER_SUBTYPES,
  SANCTION_TYPES,
} from '../src/schemas/game-event';

const basePayload = {
  matchId: 'm1',
  timestamp: 0,
  teamId: 'team-1',
  type: 'Shot',
};

describe('game-event schema', () => {
  it('accepts valid shot payloads', () => {
    const result = createGameEventSchema.safeParse({
      ...basePayload,
      playerId: 'p1',
      subtype: SHOT_SUBTYPES[0],
      distance: '6M',
      position: 'LW',
      goalZone: 'TL',
      sanctionType: SANCTION_TYPES[0],
      isCollective: false,
      hasOpposition: true,
      isCounterAttack: false,
      videoTimestamp: 10,
      activeGoalkeeperId: 'gk1',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid event types', () => {
    const result = createGameEventSchema.safeParse({ ...basePayload, type: 'Invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid subtypes when provided', () => {
    const result = createGameEventSchema.safeParse({
      ...basePayload,
      subtype: 'NotReal',
    });
    expect(result.success).toBe(false);
  });

  it('allows any event type from constants', () => {
    EVENT_TYPES.forEach((type) => {
      const result = createGameEventSchema.safeParse({ ...basePayload, type });
      expect(result.success).toBe(true);
    });
  });

  it('allows known turnover subtypes', () => {
    const result = createGameEventSchema.safeParse({
      ...basePayload,
      type: 'Turnover',
      subtype: TURNOVER_SUBTYPES[0],
    });
    expect(result.success).toBe(true);
  });

  it('allows known sanction types', () => {
    const result = createGameEventSchema.safeParse({
      ...basePayload,
      type: 'Sanction',
      sanctionType: SANCTION_TYPES[0],
    });
    expect(result.success).toBe(true);
  });
});
