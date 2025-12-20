import { Router, Request, Response } from 'express';
import { HealthService } from '../services/health-service';

type HealthRouterDeps = {
  service?: HealthService;
  startedAt?: number;
};

export function createHealthRouter(deps: HealthRouterDeps = {}): Router {
  const router = Router();
  const startedAt = deps.startedAt ?? Date.now();
  const service = deps.service ?? new HealthService();

  router.get('/', (_req: Request, res: Response) => {
    const version = process.env.npm_package_version; // available when run via npm scripts
    const status = service.getStatus(startedAt, version);
    res.status(200).json(status);
  });

  return router;
}

export default createHealthRouter();
