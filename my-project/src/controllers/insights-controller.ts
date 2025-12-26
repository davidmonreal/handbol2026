import { Request, Response } from 'express';
import { InsightsService } from '../services/insights-service';

export class InsightsController {
  constructor(private service: InsightsService) {}

  getWeeklyInsights = async (req: Request, res: Response) => {
    try {
      const data = await this.service.computeWeeklyInsights();
      res.json(data);
    } catch (error) {
      console.error('Error fetching weekly insights:', error);
      res.status(500).json({ error: 'Failed to compute weekly insights' });
    }
  };

  recomputeWeeklyInsights = async (req: Request, res: Response) => {
    try {
      const data = await this.service.computeWeeklyInsights(undefined, { forceRefresh: true });
      res.json(data);
    } catch (error) {
      console.error('Error recomputing weekly insights:', error);
      res.status(500).json({ error: 'Failed to recompute weekly insights' });
    }
  };
}
