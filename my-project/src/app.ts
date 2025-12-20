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
import insightsRouter from './routes/insights';
import { createDashboardRouter } from './routes/dashboard';
import { DashboardService } from './services/dashboard-service';
import { DashboardController } from './controllers/dashboard-controller';

import cors from 'cors';

const app = express();

// Middleware setup
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow any localhost origin (dev)
      if (origin.match(/^http:\/\/localhost:\d+$/)) {
        return callback(null, true);
      }

      // Allow specific production domains
      const allowedOrigins = [
        'https://handbol2026.vercel.app',
        'https://handbol2026-frontend.vercel.app',
      ];

      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }

      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    },
    credentials: true,
  }),
);

// Debug middleware to log origin
app.use((req, res, next) => {
  console.log('Incoming Request Origin:', req.headers.origin);
  next();
});
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
app.use('/api/insights', insightsRouter);
const dashboardService = new DashboardService();
const dashboardController = new DashboardController(dashboardService);
const dashboardRouter = createDashboardRouter({ controller: dashboardController });
app.use('/api/dashboard', dashboardRouter);

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
