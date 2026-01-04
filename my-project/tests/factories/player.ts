import { Handedness } from '@prisma/client';

type PlayerOverride = Partial<{
  name: string;
  handedness: Handedness | 'LEFT' | 'RIGHT';
  isGoalkeeper: boolean;
}>;

export function makePlayerPayload(overrides: PlayerOverride = {}) {
  return {
    name: 'test-player',
    handedness: 'RIGHT' as const,
    isGoalkeeper: false,
    ...overrides,
  };
}
