import arcjet, {shield, slidingWindow, detectBot} from '@arcjet/node';

const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJET_MODE === 'DRY_RUN' ? 'DRY_RUN' : 'LIVE';

if(!arcjetKey) throw new Error('Invalid Arcjet Key. Please set the ARCJET_KEY environment variable.');

export const httpArcjet = arcjetKey ? arcjet({
    key: arcjetKey,
    log: console,
    rules: [
        shield({ mode: arcjetMode }),
        detectBot({ mode: arcjetMode, allow: [ "CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"] }),
        slidingWindow({ mode: arcjetMode, interval: 10, max: 50})
    ]
}) : null;

export const wsArcjet = arcjetKey ? arcjet({
    key: arcjetKey,
    log: console,
    rules: [
        shield({ mode: arcjetMode }),
        detectBot({ mode: arcjetMode, allow: [ "CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"] }),
        slidingWindow({ mode: arcjetMode, interval: 10, max: 50})
    ]
}) : null;

export function securityMiddleware() {

    return async (req, res, next) => {
        if(!httpArcjet) return next();

        try{
            const decision = await httpArcjet(req);
            if(decision.isDenied){
                if(decision.reason.isRateLimit()){
                    res.status(429).json({ error: "too many requests" });
                }

                res.status(403).json({ error: "forbidden" });
            }
        }catch(e){
            console.error('Arcjet error: ', e);
            res.status(503).json({ error: "service unavailable" });
        }

        next();
    }
    
}