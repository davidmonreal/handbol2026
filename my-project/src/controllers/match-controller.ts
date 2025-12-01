import { Request, Response } from 'express';
import { Match } from '@prisma/client';
import { BaseController } from './base-controller';
import { MatchService } from '../services/match-service';

export class MatchController extends BaseController<Match> {
  constructor(service: MatchService) {
    super(service, 'Match');
  }

  async create(req: Request, res: Response) {
    // Date parsing is handled in service or here?
    // Original controller passed raw strings to service, but service expects Date objects or strings?
    // Looking at original service, it parsed strings to Date.
    // BaseController passes body directly.
    // Let's parse here to be safe and consistent with SeasonController.
    if (req.body.date) req.body.date = new Date(req.body.date);
    return super.create(req, res);
  }

  async update(req: Request, res: Response) {
    if (req.body.date) req.body.date = new Date(req.body.date);
    return super.update(req, res);
  }
}
