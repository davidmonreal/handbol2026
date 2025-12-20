import { Request, Response } from 'express';
import { Team } from '@prisma/client';
import { BaseController } from './base-controller';
import { TeamService } from '../services/team-service';
import { assignPlayerSchema } from '../schemas/team';

export class TeamController extends BaseController<Team> {
  constructor(private teamService: TeamService) {
    super(teamService, 'Team');
    this.getTeamPlayers = this.getTeamPlayers.bind(this);
    this.assignPlayer = this.assignPlayer.bind(this);
    this.unassignPlayer = this.unassignPlayer.bind(this);
  }

  async create(req: Request, res: Response) {
    // Custom validation or transformation if needed
    return super.create(req, res);
  }

  async update(req: Request, res: Response) {
    // Custom validation or transformation if needed
    return super.update(req, res);
  }

  async getTeamPlayers(req: Request, res: Response) {
    try {
      const players = await this.teamService.getTeamPlayers(req.params.id);
      res.json(players);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch team players' });
    }
  }

  async assignPlayer(req: Request, res: Response) {
    try {
      const parsed = assignPlayerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: parsed.error.issues[0]?.message ?? 'Invalid assignment payload' });
      }
      const { playerId, role } = parsed.data;
      const assignment = await this.teamService.assignPlayer(
        req.params.id,
        playerId,
        role || 'Player',
      );
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
  }

  async unassignPlayer(req: Request, res: Response) {
    try {
      await this.teamService.unassignPlayer(req.params.id, req.params.playerId);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Player not assigned to this team') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to unassign player' });
    }
  }
}
