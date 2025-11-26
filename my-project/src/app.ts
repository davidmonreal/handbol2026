import express from 'express';
import { Request, Response } from 'express';
import healthRouter from './routes/health';
import clubRouter from './routes/clubs';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.json());

// Sample route
app.get('/', (req: Request, res: Response) => {
  res.send('Hello, World!');
});

// Health route
app.use('/health', healthRouter);
app.use('/clubs', clubRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
