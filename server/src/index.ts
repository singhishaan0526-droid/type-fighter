import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { MatchManager } from './matchManager.js';
import { setupSocketHandlers } from './socketHandler.js';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    game: 'Typing Battle Online Core',
    timestamp: Date.now()
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST']
  },
  pingInterval: 10000,
  pingTimeout: 5000,
  maxHttpBufferSize: 1e5 // 100 KB max payload size
});

const matchManager = new MatchManager();

setupSocketHandlers(io, matchManager);

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`[Typing Battle Server] Online battle core running on port ${PORT}`);
    console.log(`[Typing Battle Server] Allowed origin: ${CLIENT_ORIGIN}`);
  });
}

export { app, server, io, matchManager };
