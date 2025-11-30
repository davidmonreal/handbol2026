import express from 'express';
import { Request, Response } from 'express';
import healthRouter from './routes/health';
import clubRouter from './routes/clubs';
import seasonRouter from './routes/seasons';
import playerRouter from './routes/players';
import teamRouter from './routes/teams';
import matchRouter from './routes/matches';
import gameEventRouter from './routes/game-events';

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
app.use(express.json());

// Sample route
app.get('/', (req: Request, res: Response) => {
  res.send('Hello, World!');
});

// API routes with /api prefix
app.use('/api/health', healthRouter);
app.use('/api/clubs', clubRouter);
app.use('/api/seasons', seasonRouter);
app.use('/api/players', playerRouter);
app.use('/api/teams', teamRouter);
app.use('/api/matches', matchRouter);
app.use('/api/game-events', gameEventRouter);

// Start the server only if not in serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
