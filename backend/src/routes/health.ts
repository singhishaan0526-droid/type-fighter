import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    game: 'Type Fighter Cyber Duel Backend',
    timestamp: Date.now()
  });
});
