import { z } from 'zod';

const baseEventSchema = z.object({
  matchId: z.string().min(1, 'matchId is required'),
  timestamp: z.coerce.number().nonnegative('timestamp must be zero or positive'),
  playerId: z.string().min(1).optional(),
  teamId: z.string().min(1, 'teamId is required'),
  type: z.string().min(1, 'type is required'),
  subtype: z.string().optional(),
  position: z.string().optional(),
  distance: z.string().optional(),
  isCollective: z.coerce.boolean().optional(),
  goalZone: z.string().optional(),
  sanctionType: z.string().optional(),
  hasOpposition: z.coerce.boolean().optional(),
  isCounterAttack: z.coerce.boolean().optional(),
  videoTimestamp: z.coerce.number().nonnegative().optional(),
  activeGoalkeeperId: z.string().optional(),
});

export const createGameEventSchema = baseEventSchema;

export const updateGameEventSchema = baseEventSchema.partial();

export type CreateGameEventInput = z.infer<typeof createGameEventSchema>;
export type UpdateGameEventInput = z.infer<typeof updateGameEventSchema>;
