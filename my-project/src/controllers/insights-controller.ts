import { Request, Response } from 'express';
import { InsightsService } from '../services/insights-service';

export class InsightsController {
  constructor(private service: InsightsService) {
    this.getWeeklyInsights = this.getWeeklyInsights.bind(this);
    this.recomputeWeeklyInsights = this.recomputeWeeklyInsights.bind(this);
  }

  async getWeeklyInsights(req: Request, res: Response) {
    try {
      const data = await this.service.computeWeeklyInsights();
      res.json(data);
    } catch (error) {
      console.error('Error fetching weekly insights:', error);
      res.status(500).json({ error: 'Failed to compute weekly insights' });
    }
  }

  async recomputeWeeklyInsights(req: Request, res: Response) {
    try {
      const data = await this.service.computeWeeklyInsights();
      res.json(data);
    } catch (error) {
      console.error('Error recomputing weekly insights:', error);
      res.status(500).json({ error: 'Failed to recompute weekly insights' });
    }
  }
}
