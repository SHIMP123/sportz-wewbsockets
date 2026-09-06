import { Router } from 'express';
import { db } from '../db/db.js';
import { desc } from 'drizzle-orm';
import { matches } from '../db/schema.js';
import { createMatchSchema, listMatchesQuerySchema } from '../validation/matches.js';
import { getMatchStatus } from '../utils/match-status.js';

export const matchesRouter = Router();

const MAX_LIMIT = 100;

/**
 * GET /matches - Retrieves a list of matches ordered by creation date (descending).
 * Supports pagination via query parameter limit (default 50, max 100).
 * @route GET /matches
 * @param {Object} req.query.limit - Optional limit for number of matches to return.
 * @returns {Object} 200 - JSON object with data array of matches.
 * @returns {Object} 400 - Invalid query parameters.
 * @returns {Object} 500 - Internal server error.
 */
matchesRouter.get('/', async(req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);

    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid query!", details: JSON.stringify(parsed.error)});
    }
    
    const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);

    try{
        const data = await db.select()
                             .from(matches)
                             .limit(limit)
                             .orderBy((desc(matches.createdAt)));

        res.json({ data });

    }catch(e){
        return res.status(500).json({ error: 'Internal server error' });
    }
});

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

            if(res.app.locals.broadcastMatchCreated){
                res.app.locals.broadcastMatchCreated(match);
            }

            return res.status(201).json({ data: match });
    } catch {
        return res.status(500).json({ error: 'Internal server error' });
    }
});
