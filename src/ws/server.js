import { WebSocketServer, WebSocket } from 'ws';

function sendJson(ws, payload) {
    if(ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
    for (const client of wss.clients) {
        if(client.readyState !== WebSocket.OPEN) continue;

        client.send(JSON.stringify(payload));
    }
}

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