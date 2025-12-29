import { z } from 'zod';

const dateSchema = z
  .preprocess(
    (val) => {
      if (val instanceof Date) return val;
      if (typeof val === 'string' || typeof val === 'number') return new Date(val);
      return val;
    },
    z.date({ message: 'Invalid date format' }),
  )
  .refine((date) => !isNaN(date.getTime()), { message: 'Invalid date format' });

export const createMatchSchema = z
  .object({
    date: dateSchema,
    homeTeamId: z.string().min(1, 'Home team is required'),
    awayTeamId: z.string().min(1, 'Away team is required'),
    isFinished: z.coerce.boolean().optional(),
    homeScore: z.coerce.number().int().min(0).optional(),
    awayScore: z.coerce.number().int().min(0).optional(),
  })
  .refine((data) => data.homeTeamId !== data.awayTeamId, {
    message: 'Home and Away teams must be different',
    path: ['awayTeamId'],
  });

export const updateMatchSchema = z
  .object({
    date: dateSchema.optional(),
    homeTeamId: z.string().min(1, 'Home team is required').optional(),
    awayTeamId: z.string().min(1, 'Away team is required').optional(),
    isFinished: z.coerce.boolean().optional(),
    homeScore: z.coerce.number().int().min(0).optional(),
    awayScore: z.coerce.number().int().min(0).optional(),
    videoUrl: z.string().url().nullable().optional(),
    firstHalfVideoStart: z.coerce.number().int().min(0).nullable().optional(),
    secondHalfVideoStart: z.coerce.number().int().min(0).nullable().optional(),
    realTimeFirstHalfStart: z.coerce.number().nullable().optional(),
    realTimeSecondHalfStart: z.coerce.number().nullable().optional(),
    realTimeFirstHalfEnd: z.coerce.number().nullable().optional(),
    realTimeSecondHalfEnd: z.coerce.number().nullable().optional(),
    homeEventsLocked: z.coerce.boolean().optional(),
    awayEventsLocked: z.coerce.boolean().optional(),
  })
  .refine(
    (data) => {
      if (!data.homeTeamId || !data.awayTeamId) return true;
      return data.homeTeamId !== data.awayTeamId;
    },
    {
      message: 'Home and Away teams must be different',
      path: ['awayTeamId'],
    },
  );

const matchTeamMigrationBaseSchema = z.object({
  homeTeamId: z.string().optional(),
  awayTeamId: z.string().optional(),
});

const matchTeamMigrationRefinement = (data: { homeTeamId?: string; awayTeamId?: string }) =>
  data.homeTeamId || data.awayTeamId;

export const previewMatchTeamMigrationSchema = matchTeamMigrationBaseSchema.refine(
  matchTeamMigrationRefinement,
  {
    message: 'At least one team change is required',
    path: ['homeTeamId'],
  },
);

export const applyMatchTeamMigrationSchema = matchTeamMigrationBaseSchema
  .extend({
    homeGoalkeeperId: z.string().optional(),
    awayGoalkeeperId: z.string().optional(),
  })
  .refine(matchTeamMigrationRefinement, {
    message: 'At least one team change is required',
    path: ['homeTeamId'],
  });

export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;
export type PreviewMatchTeamMigrationInput = z.infer<typeof previewMatchTeamMigrationSchema>;
export type ApplyMatchTeamMigrationInput = z.infer<typeof applyMatchTeamMigrationSchema>;
