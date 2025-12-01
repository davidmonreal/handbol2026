import { Request, Response } from 'express';
import { Player } from '@prisma/client';
import { BaseController } from './base-controller';
import { PlayerService } from '../services/player-service';

export class PlayerController extends BaseController<Player> {
  constructor(service: PlayerService) {
    super(service, 'Player');
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
