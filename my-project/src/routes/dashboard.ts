import { Router } from 'express';
import { DashboardService } from '../services/dashboard-service';
import { DashboardController } from '../controllers/dashboard-controller';

const router = Router();
const dashboardService = new DashboardService();
const dashboardController = new DashboardController(dashboardService);

router.get('/', dashboardController.getSnapshot);

export default router;
