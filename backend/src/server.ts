import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { CONFIG } from './config/index.js';
import { MatchManager } from './game/matchManager.js';
import { setupSocketHandlers } from './socket/socketHandler.js';
import { healthRouter } from './routes/health.js';

const app = express();

app.use(cors({
  origin: CONFIG.CLIENT_ORIGIN,
  methods: ['GET', 'POST']
}));
app.use(express.json());
app.use(healthRouter);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CONFIG.CLIENT_ORIGIN,
    methods: ['GET', 'POST']
  },
  pingInterval: 10000,
  pingTimeout: 5000,
  maxHttpBufferSize: CONFIG.MAX_HTTP_BUFFER_SIZE
});

const matchManager = new MatchManager();

setupSocketHandlers(io, matchManager);

if (CONFIG.NODE_ENV !== 'test') {
  server.listen(CONFIG.PORT, () => {
    console.log(`[Type Fighter Backend] Core running on port ${CONFIG.PORT}`);
    console.log(`[Type Fighter Backend] Allowed origin: ${CONFIG.CLIENT_ORIGIN}`);
  });
}

export { app, server, io, matchManager };
