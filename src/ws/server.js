import { WebSocketServer, WebSocket } from 'ws';
import { wsArcjet } from './arcjet.js';

/**
 * Sends a JSON payload to a WebSocket client if the connection is open.
 * @param {WebSocket} ws - The WebSocket client to send data to.
 * @param {Object} payload - The data to send, will be JSON stringified.
 */
function sendJson(ws, payload) {
    if(ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify(payload));
}

/**
 * Broadcasts a JSON payload to all connected WebSocket clients.
 * @param {WebSocketServer} wss - The WebSocket server instance.
 * @param {Object} payload - The data to broadcast, will be JSON stringified.
 */
function broadcast(wss, payload) {
    for (const client of wss.clients) {
        if(client.readyState !== WebSocket.OPEN) continue;

        client.send(JSON.stringify(payload));
    }
}

/**
 * Attaches a WebSocket server to an HTTP server and sets up connection handling.
 * @param {http.Server} server - The HTTP server to attach the WebSocket server to.
 * @returns {Object} An object containing the broadcastMatchCreated function.
 */
export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({
        server,
        path: '/ws',
        maxPayload: 1024 * 1024,
    });

    wss.on("connection", async (ws, req) => {
        if(wsArcjet) {
            try{
                const decision = await wsArcjet.protect(req);

                if(decision.isDenied){
                    const code = decision.reason.isRateLimit() ? 1013 : 1008;
                    const reason = decision.reason.isRateLimit() ? "Too many requests" : "Forbidden";

                    ws.close(code, reason);
                    return;
                }
            }catch(e){
                console.error('Arcjet error: ', e);
                ws.close(1011, "Service unavailable");
                return;
            }
        }
        ws.isAlive = true;
        ws.on('pong', () => { ws.isAlive = true });
        sendJson(ws, { type: 'Welcome' });

        ws.on('error', console.error);
    });

    const interval = setTimeout(() => {
        wss.clients.forEach((ws) => {
            if(!ws.isAlive) return ws.terminate();

            ws.isAlive = false;
            ws.ping();
        }, 30000);
    });

    wss.on('close', () => { clearInterval(interval) });

    function broadcastMatchCreated(match) {
        broadcast(wss, { type: 'Match created.', data: match }); 
    }

    return { broadcastMatchCreated };
}