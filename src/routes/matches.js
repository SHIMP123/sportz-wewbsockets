import Router from 'express';
import { createMatchSchema } from '../schemas/matches.js';
import { db } from '../db/db.js';

const matchRouter = Router();

matchRouter.get('/', (req, res) => {
    res.status(200).json({message: 'Matches list.'})
})

matchRouter.post('/', async (req, res) => {
    const parse = createMatchSchema.safeParse(req.body);
    const { data: { startTime, endTime, sport, homeScore, awayScore } } = parse;

    if (!parse.success) {
        return res.status(400).json({ error: parse.error});
    }

    try{
         
        const [event] = await db.insert(db.matches).values({
            ...parse.data,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            homeScore: homeScore ?? 0,
            awayScore: awayScore ?? 0,
            status: getMatchStatus(startTime, endTime),
        }).returning();

        res.status(201).json({ data: event });
    }catch(e){
        return res.status(500).json({ error: 'Internal server error' });
    }

})

export default matchRouter;