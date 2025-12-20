import { z } from 'zod';

const handednessSchema = z.enum(['LEFT', 'RIGHT']);

const basePlayerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  number: z.coerce.number().int().min(0, 'Player number must be zero or positive'),
  handedness: handednessSchema.optional(),
  isGoalkeeper: z.coerce.boolean().optional(),
});

export const createPlayerSchema = basePlayerSchema.extend({
  isGoalkeeper: z.coerce.boolean().optional().default(false),
});

export const updatePlayerSchema = basePlayerSchema.partial();

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
