/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { SeasonService } from '../services/season-service';

export class SeasonController {
  constructor(private seasonService: SeasonService) {}

  getAll = async (req: Request, res: Response) => {
    try {
      const seasons = await this.seasonService.getAll();
      res.json(seasons);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch seasons' });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const season = await this.seasonService.getById(req.params.id);
      if (!season) {
        return res.status(404).json({ error: 'Season not found' });
      }
      res.json(season);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch season' });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const { name, startDate, endDate } = req.body;
      const season = await this.seasonService.create({
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
      res.status(201).json(season);
    } catch (error) {
      if (error instanceof Error && error.message === 'End date must be after start date') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create season' });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { name, startDate, endDate } = req.body;
      const updateData: any = { name };
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate) updateData.endDate = new Date(endDate);

      const season = await this.seasonService.update(req.params.id, updateData);
      res.json(season);
    } catch (error) {
      if (error instanceof Error && error.message === 'End date must be after start date') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update season' });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      await this.seasonService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete season' });
    }
  };
}
