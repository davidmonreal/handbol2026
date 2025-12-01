import { Request, Response } from 'express';
import { Club } from '@prisma/client';
import { BaseController } from './base-controller';
import { ClubService } from '../services/club-service';

export class ClubController extends BaseController<Club> {
  constructor(service: ClubService) {
    super(service, 'Club');
  }

  // Override create to add specific validation
  async create(req: Request, res: Response) {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    return super.create(req, res);
  }
}
