import { z } from 'zod';

import { createPlayerSchema } from './player';
import { isValidPlayerPosition } from '../types/player-position';

const mergePlayerDataSchema = createPlayerSchema.extend({
  position: z
    .number()
    .int()
    .refine(isValidPlayerPosition, {
      message: 'Invalid position',
    })
    .optional(),
});

export const mergePlayerSchema = z.object({
  oldPlayerId: z.string().min(1, 'oldPlayerId and newPlayerData are required'),
  newPlayerData: mergePlayerDataSchema,
  teamId: z.string().optional(),
});

export type MergePlayerInput = z.infer<typeof mergePlayerSchema>;
