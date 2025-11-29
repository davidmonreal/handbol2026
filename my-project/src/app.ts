import express from 'express';
import { Request, Response } from 'express';
import healthRouter from './routes/health';
import clubRouter from './routes/clubs';

import seasonRouter from './routes/seasons';
import playerRouter from './routes/players';
import teamRouter from './routes/teams';

import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(cors()); // Enable CORS for frontend
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
