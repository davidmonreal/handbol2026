import { Request, Response } from 'express';
import { ClubService } from '../services/club-service';

export class ClubController {
  constructor(private clubService: ClubService) {}

  getAll = async (req: Request, res: Response) => {
    try {
      const clubs = await this.clubService.getAllClubs();
      res.json(clubs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch clubs' });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const club = await this.clubService.getClubById(id);
      if (!club) {
        return res.status(404).json({ error: 'Club not found' });
      }
      res.json(club);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch club' });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }
      const club = await this.clubService.createClub(name);
      res.status(201).json(club);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create club' });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const club = await this.clubService.updateClub(id, name);
      res.json(club);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update club' });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.clubService.deleteClub(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete club' });
    }
  };
}
