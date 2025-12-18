import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard-service';

const CACHE_SECONDS = (() => {
  const parsed = Number(process.env.DASHBOARD_CACHE_SECONDS);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 60;
})();

const STALE_SECONDS = (() => {
  const parsed = Number(process.env.DASHBOARD_STALE_SECONDS);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 300;
})();

export class DashboardController {
  constructor(private service: DashboardService) {
    this.getSnapshot = this.getSnapshot.bind(this);
  }

  async getSnapshot(req: Request, res: Response) {
    try {
      const snapshot = await this.service.getSnapshot();
      if (CACHE_SECONDS > 0) {
        res.set(
          'Cache-Control',
          `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`,
        );
      }
      res.json(snapshot);
    } catch (error) {
      console.error('Error building dashboard snapshot:', error);
      res.status(500).json({ error: 'Failed to load dashboard data' });
    }
  }
}
