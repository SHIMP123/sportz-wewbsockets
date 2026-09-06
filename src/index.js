import express from 'express';
import http from 'http';
import { matchesRouter } from './routes/matches.js';
import { attachWebSocketServer } from './ws/server.js';

const app = express();
const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.json());

app.get('/', (req, res) => {
	res.send('Sportz server is running.');
});

app.use('/matches', matchesRouter);

const server = http.createServer(app);
const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

server.listen(PORT, HOST, (req, res) => {
	const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
	console.log(`Server running at ${baseUrl}`);
	console.log(`WebSocket server is running on ${baseUrl.replace('http', 'ws')}/ws`);
});
