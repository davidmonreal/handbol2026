import { z } from 'zod';

import { isValidPlayerPosition } from '../types/player-position';

export const assignPlayerSchema = z.object({
  playerId: z.string(),
  position: z.number().int().refine(isValidPlayerPosition, {
    message: 'Invalid position',
  }),
});

export type AssignPlayerInput = z.infer<typeof assignPlayerSchema>;

export const updatePlayerPositionSchema = z.object({
  position: z.number().int().refine(isValidPlayerPosition, {
    message: 'Invalid position',
  }),
});

export type UpdatePlayerPositionInput = z.infer<typeof updatePlayerPositionSchema>;
