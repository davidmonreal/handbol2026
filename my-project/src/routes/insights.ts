import { Router } from 'express';
import { InsightsService } from '../services/insights-service';
import { InsightsController } from '../controllers/insights-controller';

type InsightsRouterDeps = {
  controller?: InsightsController;
  service?: InsightsService;
};

export function createInsightsRouter(deps: InsightsRouterDeps = {}): Router {
  const router = Router();
  const controller =
    deps.controller ?? new InsightsController(deps.service ?? new InsightsService());

  router.get('/weekly', controller.getWeeklyInsights);
  router.post('/weekly/recompute', controller.recomputeWeeklyInsights);

  return router;
}

export default createInsightsRouter();
