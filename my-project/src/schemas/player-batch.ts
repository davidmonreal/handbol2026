import { z } from 'zod';

// Validate only the wrapper; each player is validated per-item in the service
export const batchPlayersSchema = z.object({
  players: z
    .array(z.any(), {
      invalid_type_error: 'Players array is required',
      required_error: 'Players array is required',
    })
    .min(1, 'Players array is required'),
});

export const batchPlayersWithTeamSchema = batchPlayersSchema.extend({
  teamId: z
    .string({
      invalid_type_error: 'teamId is required',
      required_error: 'teamId is required',
    })
    .min(1, 'teamId is required'),
});

export type BatchPlayersInput = z.infer<typeof batchPlayersSchema>;
export type BatchPlayersWithTeamInput = z.infer<typeof batchPlayersWithTeamSchema>;
