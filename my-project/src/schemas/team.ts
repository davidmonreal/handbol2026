import { z } from 'zod';

import { isValidPlayerPosition } from '../types/player-position';

const numberSchema = z.coerce
  .number()
  .int()
  .min(0, 'Player number must be zero or positive')
  .max(99, 'Player number must be between 0 and 99');

export const assignPlayerSchema = z.object({
  playerId: z.string(),
  number: numberSchema,
  position: z.number().int().refine(isValidPlayerPosition, {
    message: 'Invalid position',
  }),
});

export type AssignPlayerInput = z.infer<typeof assignPlayerSchema>;

export const updatePlayerAssignmentSchema = z
  .object({
    number: numberSchema.optional(),
    position: z
      .number()
      .int()
      .refine(isValidPlayerPosition, {
        message: 'Invalid position',
      })
      .optional(),
  })
  .refine((data) => data.number !== undefined || data.position !== undefined, {
    message: 'Number or position is required',
  });

export type UpdatePlayerAssignmentInput = z.infer<typeof updatePlayerAssignmentSchema>;
