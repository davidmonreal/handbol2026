import { Request, Response } from 'express';
import { TeamService } from '../services/team-service';

export class TeamController {
  constructor(private teamService: TeamService) { }

  getAll = async (req: Request, res: Response) => {
    try {
      const teams = await this.teamService.getAll();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch teams' });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const team = await this.teamService.getById(req.params.id);
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch team' });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const { name, category, clubId, seasonId, isMyTeam } = req.body;
      const team = await this.teamService.create({ name, category, clubId, seasonId, isMyTeam });
      res.status(201).json(team);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === 'Club not found' || error.message === 'Season not found')
      ) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create team' });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { name, category, clubId, seasonId, isMyTeam } = req.body;
      const updateData: any = {};
      if (name) updateData.name = name;
      if (category) updateData.category = category;
      if (clubId) updateData.clubId = clubId;
      if (seasonId) updateData.seasonId = seasonId;
      if (isMyTeam !== undefined) updateData.isMyTeam = isMyTeam;

      const team = await this.teamService.update(req.params.id, updateData);
      res.json(team);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === 'Club not found' || error.message === 'Season not found')
      ) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update team' });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      await this.teamService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete team' });
    }
  };

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
      const { playerId, role } = req.body;
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
}
