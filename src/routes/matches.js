import { Router } from 'express';
import { db } from '../db/db.js';
import { desc } from 'drizzle-orm';
import { matches } from '../db/schema.js';
import { createMatchSchema, listMatchesQuerySchema } from '../validation/matches.js';
import { getMatchStatus } from '../utils/match-status.js';

export const matchesRouter = Router();

const MAX_LIMIT = 100;

matchesRouter.post('/', async (req, res) => {
    const parse = createMatchSchema.safeParse(req.body);

    if (!parse.success) {
        return res.status(400).json({ error: parse.error });
    }

    const { startTime, endTime, homeScore, awayScore } = parse.data;

    try {
        const [match] = await db
            .insert(matches)
            .values({
                ...parse.data,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                homeScore: homeScore ?? 0,
                awayScore: awayScore ?? 0,
                status: getMatchStatus(startTime, endTime),
            })
            .returning();

        return res.status(201).json({ data: match });
    } catch {
        return res.status(500).json({ error: 'Internal server error' });
    }
});
