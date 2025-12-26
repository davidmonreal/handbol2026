import { Request, Response } from 'express';
import { Season } from '@prisma/client';
import { BaseController } from './base-controller';
import { SeasonService } from '../services/season-service';

export class SeasonController extends BaseController<Season> {
  constructor(service: SeasonService) {
    super(service, 'Season');
  }

  create = async (req: Request, res: Response) => {
    if (req.body.startDate) req.body.startDate = new Date(req.body.startDate);
    if (req.body.endDate) req.body.endDate = new Date(req.body.endDate);
    return this._create(req, res);
  };

  update = async (req: Request, res: Response) => {
    if (req.body.startDate) req.body.startDate = new Date(req.body.startDate);
    if (req.body.endDate) req.body.endDate = new Date(req.body.endDate);
    return this._update(req, res);
  };
}
