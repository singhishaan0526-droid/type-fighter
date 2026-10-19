import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { CONFIG } from './config/index.js';
import { MatchManager } from './game/matchManager.js';
import { setupSocketHandlers } from './socket/socketHandler.js';
import { healthRouter } from './routes/health.js';

const app = express();

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true;
  if (CONFIG.CLIENT_ORIGIN === '*') return true;
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return true;
  if (
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.endsWith('.onrender.com') ||
    origin.endsWith('.vercel.app')
  ) {
    return true;
  }
  return true; // Flexible origin policy for multiplayer game
};

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    callback(null, isOriginAllowed(origin));
  },
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(healthRouter);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, isOriginAllowed(origin));
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingInterval: 10000,
  pingTimeout: 5000,
  maxHttpBufferSize: CONFIG.MAX_HTTP_BUFFER_SIZE
});

const matchManager = new MatchManager();

setupSocketHandlers(io, matchManager);

if (CONFIG.NODE_ENV !== 'test') {
  server.listen(CONFIG.PORT, '0.0.0.0', () => {
    console.log(`[Type Fighter Backend] Core running on port ${CONFIG.PORT} (0.0.0.0)`);
    console.log(`[Type Fighter Backend] Allowed origin: ${CONFIG.CLIENT_ORIGIN}`);
  });
}

export { app, server, io, matchManager };
