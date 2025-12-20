import { z } from 'zod';

export const assignPlayerSchema = z.object({
  playerId: z.string(),
  role: z.string().optional(),
});

export type AssignPlayerInput = z.infer<typeof assignPlayerSchema>;
