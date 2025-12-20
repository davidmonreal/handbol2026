import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard-controller';

type DashboardRouterDeps = {
  controller: DashboardController;
};

export function createDashboardRouter(deps: DashboardRouterDeps): Router {
  const router = Router();

  router.get('/', deps.controller.getSnapshot);

  return router;
}
