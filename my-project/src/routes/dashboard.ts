import { Router } from 'express';
import { DashboardService } from '../services/dashboard-service';
import { DashboardController } from '../controllers/dashboard-controller';

type DashboardRouterDeps = {
  controller?: DashboardController;
  service?: DashboardService;
};

export function createDashboardRouter(deps: DashboardRouterDeps = {}): Router {
  const router = Router();
  const controller =
    deps.controller ?? new DashboardController(deps.service ?? new DashboardService());

  router.get('/', controller.getSnapshot);

  return router;
}

export default createDashboardRouter();
