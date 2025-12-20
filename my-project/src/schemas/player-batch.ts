import { z } from 'zod';

// Validate only the wrapper; each player is validated per-item in the service
export const batchPlayersSchema = z.object({
  players: z.array(z.any()).min(1, 'Players array is required'),
});

export const batchPlayersWithTeamSchema = batchPlayersSchema.extend({
  teamId: z.string().min(1, 'teamId is required'),
});

export type BatchPlayersInput = z.infer<typeof batchPlayersSchema>;
export type BatchPlayersWithTeamInput = z.infer<typeof batchPlayersWithTeamSchema>;
