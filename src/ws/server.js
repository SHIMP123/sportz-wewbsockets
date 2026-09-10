import { WebSocketServer, WebSocket } from 'ws';

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

    wss.on("connection", (ws) => {
        sendJson(ws, { type: 'Welcome' });

        ws.on('error', console.error);
    })

    function broadcastMatchCreated(match) {
        broadcast(wss, { type: 'Match created.', data: match }); 
    }

    return { broadcastMatchCreated };
}