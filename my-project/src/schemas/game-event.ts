import { z } from 'zod';

export const EVENT_TYPES = ['Shot', 'Turnover', 'Sanction'] as const;
export const SHOT_SUBTYPES = ['Goal', 'Save', 'Miss', 'Post', 'Block'] as const;
export const TURNOVER_SUBTYPES = [
  'Pass',
  'Steps',
  'Double',
  'Area',
  'Catch',
  'Dribble',
  'Offensive Foul',
] as const;
export const SANCTION_TYPES = ['Foul', 'Yellow', '2min', 'Red', 'Blue Card'] as const;

const eventTypeSchema = z.enum(EVENT_TYPES);
const shotSubtypeSchema = z.enum(SHOT_SUBTYPES);
const turnoverSubtypeSchema = z.enum(TURNOVER_SUBTYPES);
const sanctionSubtypeSchema = z.enum(SANCTION_TYPES);
const sanctionTypeSchema = z.enum(SANCTION_TYPES);

const baseEventSchema = z.object({
  matchId: z.string().min(1, 'matchId is required'),
  timestamp: z.coerce.number().nonnegative('timestamp must be zero or positive'),
  playerId: z.string().min(1).optional(),
  teamId: z.string().min(1, 'teamId is required'),
  type: eventTypeSchema,
  subtype: z.union([shotSubtypeSchema, turnoverSubtypeSchema, sanctionSubtypeSchema]).optional(),
  position: z.string().optional(),
  distance: z.string().optional(),
  isCollective: z.coerce.boolean().optional(),
  goalZone: z.string().optional(),
  sanctionType: sanctionTypeSchema.optional(),
  hasOpposition: z.coerce.boolean().optional(),
  isCounterAttack: z.coerce.boolean().optional(),
  videoTimestamp: z.coerce.number().nonnegative().optional(),
  activeGoalkeeperId: z.string().optional(),
});

export const createGameEventSchema = baseEventSchema;

export const updateGameEventSchema = baseEventSchema.partial();

export type CreateGameEventInput = z.infer<typeof createGameEventSchema>;
export type UpdateGameEventInput = z.infer<typeof updateGameEventSchema>;
