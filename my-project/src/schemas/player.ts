import { z } from 'zod';

const handednessSchema = z.enum(['LEFT', 'RIGHT']);

const numberSchema = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.coerce
    .number()
    .int()
    .min(0, 'Player number must be zero or positive')
    .max(99, 'Player number must be between 0 and 99'),
);

const basePlayerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(50, 'Name must be at most 50 characters'),
    number: numberSchema,
    handedness: handednessSchema.optional(),
    isGoalkeeper: z.coerce.boolean().optional(),
  })
  .strict();

export const createPlayerSchema = basePlayerSchema.extend({
  handedness: handednessSchema.default('RIGHT'),
  isGoalkeeper: z.coerce.boolean().optional().default(false),
});

export const updatePlayerSchema = basePlayerSchema
  .partial()
  .refine((data) => (data.number === undefined ? true : !Number.isNaN(data.number)), {
    message: 'Player number must be a valid number',
    path: ['number'],
  });

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
