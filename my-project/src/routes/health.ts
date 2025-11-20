import { Router, Request, Response } from 'express';
import { HealthService } from '../services/health-service';

const router = Router();
const startedAt = Date.now();
const service = new HealthService();

router.get('/', (_req: Request, res: Response) => {
  const version = process.env.npm_package_version; // available when run via npm scripts
  const status = service.getStatus(startedAt, version);
  res.status(200).json(status);
});

export default router;

