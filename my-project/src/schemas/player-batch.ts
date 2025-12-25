import { z } from 'zod';

export const batchPlayersSchema = z
  .object({
    players: z.any(),
  })
  .superRefine((data, ctx) => {
    if (!Array.isArray(data.players) || data.players.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Players array is required',
        path: ['players'],
      });
    }
  });

export const batchPlayersWithTeamSchema = z
  .object({
    players: z.any(),
    teamId: z.any(),
  })
  .superRefine((data, ctx) => {
    if (!Array.isArray(data.players) || data.players.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Players array is required',
        path: ['players'],
      });
    }
    if (typeof data.teamId !== 'string' || data.teamId.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'teamId is required',
        path: ['teamId'],
      });
    }
  });

export type BatchPlayersInput = z.infer<typeof batchPlayersSchema>;
export type BatchPlayersWithTeamInput = z.infer<typeof batchPlayersWithTeamSchema>;
