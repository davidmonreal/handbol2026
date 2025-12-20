import { z } from 'zod';

export const assignPlayerSchema = z.object({
  playerId: z.string({
    required_error: 'playerId is required',
    invalid_type_error: 'playerId is required',
  }),
  role: z.string().optional(),
});

export type AssignPlayerInput = z.infer<typeof assignPlayerSchema>;
