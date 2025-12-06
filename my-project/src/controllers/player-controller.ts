import { Request, Response } from 'express';
import { Player } from '@prisma/client';
import { BaseController } from './base-controller';
import { PlayerService } from '../services/player-service';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export class PlayerController extends BaseController<Player> {
  private playerService: PlayerService;

  constructor(service: PlayerService) {
    super(service, 'Player');
    this.playerService = service;
  }

  async getAll(req: Request, res: Response) {
    try {
      const skip = Math.max(0, parseInt(req.query.skip as string) || 0);
      const take = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.take as string) || DEFAULT_PAGE_SIZE));
      const search = (req.query.search as string) || undefined;
      const clubId = (req.query.clubId as string) || undefined;

      // If no pagination params, use legacy behavior for backwards compatibility
      if (!req.query.skip && !req.query.take && !req.query.search && !req.query.clubId) {
        return super.getAll(req, res);
      }

      const [data, total] = await Promise.all([
        this.playerService.getAllPaginated({ skip, take, search, clubId }),
        this.playerService.count({ search, clubId }),
      ]);

      res.json({ data, total, skip, take });
    } catch (error) {
      console.error('Error fetching players:', error);
      res.status(500).json({
        error: 'Failed to fetch players',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async create(req: Request, res: Response) {
    const { number, handedness } = req.body;

    // Specific validation
    if (parseInt(number) < 0) {
      return res.status(400).json({ error: 'Player number must be positive' });
    }
    if (handedness && !['LEFT', 'RIGHT'].includes(handedness)) {
      return res.status(400).json({ error: 'Handedness must be LEFT or RIGHT' });
    }

    // Data transformation
    if (req.body.number) req.body.number = parseInt(req.body.number);
    if (req.body.isGoalkeeper === undefined) req.body.isGoalkeeper = false;

    return super.create(req, res);
  }

  async update(req: Request, res: Response) {
    const { number, handedness } = req.body;

    // Specific validation
    if (number && parseInt(number) < 0) {
      return res.status(400).json({ error: 'Player number must be positive' });
    }
    if (handedness && !['LEFT', 'RIGHT'].includes(handedness)) {
      return res.status(400).json({ error: 'Handedness must be LEFT or RIGHT' });
    }

    // Data transformation
    if (req.body.number) req.body.number = parseInt(req.body.number);

    return super.update(req, res);
  }
}
