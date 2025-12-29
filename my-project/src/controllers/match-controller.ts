import { Match } from '@prisma/client';
import { Request, Response } from 'express';
import { BaseController } from './base-controller';
import { MatchService } from '../services/match-service';

export class MatchController extends BaseController<Match> {
  constructor(service: MatchService) {
    super(service, 'Match');
  }

  previewTeamMigration = async (req: Request, res: Response) => {
    try {
      const preview = await (this.service as MatchService).previewTeamMigration(
        req.params.id,
        req.body,
      );
      res.json(preview);
    } catch (error) {
      console.error('Error previewing match migration:', error);
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ error: error.message });
        }
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to preview match migration' });
    }
  };

  applyTeamMigration = async (req: Request, res: Response) => {
    try {
      const updated = await (this.service as MatchService).applyTeamMigration(
        req.params.id,
        req.body,
      );
      res.json(updated);
    } catch (error) {
      console.error('Error applying match migration:', error);
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ error: error.message });
        }
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to apply match migration' });
    }
  };
}
