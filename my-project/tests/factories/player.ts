import { Handedness } from '@prisma/client';

type PlayerOverride = Partial<{
  name: string;
  number: number;
  handedness: Handedness | 'LEFT' | 'RIGHT';
  isGoalkeeper: boolean;
}>;

export function makePlayerPayload(overrides: PlayerOverride = {}) {
  return {
    name: 'Test Player',
    number: 1,
    handedness: 'RIGHT' as const,
    isGoalkeeper: false,
    ...overrides,
  };
}
