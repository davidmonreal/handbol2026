import { z } from 'zod';

import { createPlayerSchema } from './player';
import { isValidPlayerPosition } from '../types/player-position';

const numberSchema = z.coerce
  .number()
  .int()
  .min(0, 'Player number must be zero or positive')
  .max(99, 'Player number must be between 0 and 99');

const mergePlayerDataSchema = createPlayerSchema.extend({
  number: numberSchema.optional(),
  position: z
    .number()
    .int()
    .refine(isValidPlayerPosition, {
      message: 'Invalid position',
    })
    .optional(),
});

export const mergePlayerSchema = z
  .object({
    oldPlayerId: z.string().min(1, 'oldPlayerId and newPlayerData are required'),
    newPlayerData: mergePlayerDataSchema,
    teamId: z.string().optional(),
  })
  .refine((data) => (data.teamId ? data.newPlayerData.number !== undefined : true), {
    message: 'Player number is required when teamId is provided',
    path: ['newPlayerData', 'number'],
  });

export type MergePlayerInput = z.infer<typeof mergePlayerSchema>;
