import express from 'express';
import { Request, Response, NextFunction } from 'express';
import healthRouter from './routes/health';
import clubRouter from './routes/clubs';
import seasonRouter from './routes/seasons';
import playerRouter from './routes/players';
import teamRouter from './routes/teams';
import matchRouter from './routes/matches';
import gameEventRouter from './routes/game-events';
import importRouter from './routes/import.routes';

import cors from 'cors';

const app = express();

// Middleware setup
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://handbol2026.vercel.app',
      'https://handbol2026-frontend.vercel.app',
    ],
    credentials: true,
  }),
); // Enable CORS for frontend
app.use(express.json({ limit: '1mb' }));

// Sample route
app.get('/', (req: Request, res: Response) => {
  res.send('Hello, World!');
});

// API routes with /api prefix
app.use('/api', importRouter); // Mounts /import-players-from-image, /players/check-duplicates, etc.
app.use('/api/health', healthRouter);
app.use('/api/clubs', clubRouter);
app.use('/api/seasons', seasonRouter);
app.use('/api/players', playerRouter);
app.use('/api/teams', teamRouter);
app.use('/api/matches', matchRouter);
app.use('/api/game-events', gameEventRouter);

// Global error handler for body-parser errors (e.g. payload too large)
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (
    err &&
    typeof err === 'object' &&
    'type' in err &&
    (err as { type: string }).type === 'entity.too.large'
  ) {
    return res.status(413).json({
      error: 'Image is too large. Please upload an image smaller than 1MB.',
    });
  }
  next(err);
});

// Start the server only if not in serverless environment and not in test mode
if (
  (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') ||
  (!process.env.VERCEL && process.env.NODE_ENV !== 'test')
) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
