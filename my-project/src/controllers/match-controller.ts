import { Request, Response } from 'express';
import { Match } from '@prisma/client';
import { BaseController } from './base-controller';
import { MatchService } from '../services/match-service';

export class MatchController extends BaseController<Match> {
  constructor(service: MatchService) {
    super(service, 'Match');
  }

  async create(req: Request, res: Response) {
    return super.create(req, res);
  }

  async update(req: Request, res: Response) {
    return super.update(req, res);
  }
}
