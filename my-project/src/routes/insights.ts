import { Router } from 'express';
import { InsightsService } from '../services/insights-service';
import { InsightsController } from '../controllers/insights-controller';

const router = Router();
const insightsService = new InsightsService();
const insightsController = new InsightsController(insightsService);

router.get('/weekly', insightsController.getWeeklyInsights);
router.post('/weekly/recompute', insightsController.recomputeWeeklyInsights);

export default router;
