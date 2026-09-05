import { z } from 'zod';

export const MATCH_STATUS = Object.freeze({
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
});

const positiveInteger = z.coerce.number().int().positive();
const nonNegativeInteger = z.coerce.number().int().nonnegative();

const isoDateString = z.string().refine(
  (value) => {
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && value.includes('T');
  },
  { message: 'Must be a valid ISO date string' },
);

export const listMatchesQuerySchema = z.object({
  limit: positiveInteger.max(100).optional(),
});

export const matchIdParamSchema = z.object({
  id: positiveInteger,
});

export const createMatchSchema = z
  .object({
    sport: z.string().trim().min(1),
    homeTeam: z.string().trim().min(1),
    awayTeam: z.string().trim().min(1),
    startTime: isoDateString,
    endTime: isoDateString,
    homeScore: nonNegativeInteger.optional(),
    awayScore: nonNegativeInteger.optional(),
  })
  .superRefine(({ startTime, endTime }, context) => {
    if (new Date(endTime) <= new Date(startTime)) {
      context.addIssue({
        code: 'custom',
        path: ['endTime'],
        message: 'endTime must be after startTime',
      });
    }
  });

export const updateScoreSchema = z.object({
  homeScore: nonNegativeInteger,
  awayScore: nonNegativeInteger,
});
