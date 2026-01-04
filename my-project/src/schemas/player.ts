import { z } from 'zod';

const handednessSchema = z.enum(['LEFT', 'RIGHT']);

const basePlayerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(50, 'Name must be at most 50 characters'),
    handedness: handednessSchema.optional(),
    isGoalkeeper: z.coerce.boolean().optional(),
  })
  .strict();

export const createPlayerSchema = basePlayerSchema.extend({
  handedness: handednessSchema.default('RIGHT'),
  isGoalkeeper: z.coerce.boolean().optional().default(false),
});

export const updatePlayerSchema = basePlayerSchema.partial();

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
