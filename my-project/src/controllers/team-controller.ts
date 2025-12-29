import { Request, Response } from 'express';
import { Team } from '@prisma/client';
import { BaseController } from './base-controller';
import { TeamService } from '../services/team-service';
import { assignPlayerSchema, updatePlayerPositionSchema } from '../schemas';

export class TeamController extends BaseController<Team> {
  constructor(private teamService: TeamService) {
    super(teamService, 'Team');
  }

  getTeamPlayers = async (req: Request, res: Response) => {
    try {
      const players = await this.teamService.getTeamPlayers(req.params.id);
      res.json(players);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch team players' });
    }
  };

  assignPlayer = async (req: Request, res: Response) => {
    try {
      const parsed = assignPlayerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: parsed.error.issues[0]?.message ?? 'Invalid assignment payload' });
      }
      const { playerId, position } = parsed.data;
      const assignment = await this.teamService.assignPlayer(req.params.id, playerId, position);
      res.status(201).json(assignment);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === 'Player not found' ||
          error.message === 'Player already assigned to this team')
      ) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to assign player' });
    }
  };

  unassignPlayer = async (req: Request, res: Response) => {
    try {
      await this.teamService.unassignPlayer(req.params.id, req.params.playerId);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Player not assigned to this team') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to unassign player' });
    }
  };

  updatePlayerPosition = async (req: Request, res: Response) => {
    try {
      const parsed = updatePlayerPositionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message ?? 'Invalid position payload',
        });
      }
      const assignment = await this.teamService.updatePlayerPosition(
        req.params.id,
        req.params.playerId,
        parsed.data.position,
      );
      res.json(assignment);
    } catch (error) {
      if (error instanceof Error && error.message === 'Player not assigned to this team') {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof Error && error.message === 'Invalid position') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update player position' });
    }
  };
}
