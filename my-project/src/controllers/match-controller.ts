/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { MatchService } from '../services/match-service';

export class MatchController {
  constructor(private matchService: MatchService) {}

  getAll = async (req: Request, res: Response) => {
    try {
      const matches = await this.matchService.getAll();
      res.json(matches);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch matches' });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const match = await this.matchService.getById(req.params.id);
      if (!match) {
        return res.status(404).json({ error: 'Match not found' });
      }
      res.json(match);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch match' });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const { date, homeTeamId, awayTeamId } = req.body;
      const match = await this.matchService.create({ date, homeTeamId, awayTeamId });
      res.status(201).json(match);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'Home and Away teams must be different' ||
          error.message === 'Invalid date format' ||
          error.message.includes('not found')
        ) {
          return res.status(400).json({ error: error.message });
        }
      }
      res.status(500).json({ error: 'Failed to create match' });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { date, homeTeamId, awayTeamId, isFinished } = req.body;
      const updateData: Record<string, any> = {};
      if (date) updateData.date = date;
      if (homeTeamId) updateData.homeTeamId = homeTeamId;
      if (awayTeamId) updateData.awayTeamId = awayTeamId;
      if (isFinished !== undefined) updateData.isFinished = isFinished;

      const match = await this.matchService.update(req.params.id, updateData);
      res.json(match);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Match not found') {
          return res.status(404).json({ error: error.message });
        }
        if (
          error.message === 'Home and Away teams must be different' ||
          error.message === 'Invalid date format' ||
          error.message.includes('not found')
        ) {
          return res.status(400).json({ error: error.message });
        }
      }
      res.status(500).json({ error: 'Failed to update match' });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      await this.matchService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete match' });
    }
  };
}
