import { NextFunction, Request, Response } from 'express';
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

export const buildDashboardCacheControl = (cacheSeconds: number, staleSeconds: number) => {
  if (cacheSeconds <= 0) return 'no-store';
  return `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${staleSeconds}`;
};

type Logger = { error: (...args: unknown[]) => void };

export class DashboardController {
  constructor(
    private service: DashboardService,
    private logger: Logger = console,
  ) {
    this.getSnapshot = this.getSnapshot.bind(this);
  }

  async getSnapshot(req: Request, res: Response, next: NextFunction) {
    try {
      const snapshot = await this.service.getSnapshot();
      res.set('Cache-Control', buildDashboardCacheControl(CACHE_SECONDS, STALE_SECONDS));
      res.json(snapshot);
    } catch (error) {
      this.logger.error('Error building dashboard snapshot', error);
      next(error);
    }
  }
}
