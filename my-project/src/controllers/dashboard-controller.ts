import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard-service';

const CACHE_SECONDS = (() => {
  const parsed = Number(process.env.DASHBOARD_CACHE_SECONDS);
  // Default to no cache so deletes/updates show up immediately on the dashboard.
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
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
      res.set(
        'Cache-Control',
        CACHE_SECONDS > 0
          ? `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`
          : 'no-store',
      );
      res.json(snapshot);
    } catch (error) {
      console.error('Error building dashboard snapshot:', error);
      res.status(500).json({ error: 'Failed to load dashboard data' });
    }
  }
}
