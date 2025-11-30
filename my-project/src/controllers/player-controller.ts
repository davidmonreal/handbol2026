/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { PlayerService } from '../services/player-service';

export class PlayerController {
  constructor(private playerService: PlayerService) {}

  getAll = async (req: Request, res: Response) => {
    try {
      const players = await this.playerService.getAll();
      res.json(players);
    } catch (error) {
      console.error('Error fetching players:', error);
      res.status(500).json({
        error: 'Failed to fetch players',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const player = await this.playerService.getById(req.params.id);
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }
      res.json(player);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch player' });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const { name, number, handedness } = req.body;
      const player = await this.playerService.create({
        name,
        number: parseInt(number),
        handedness,
      });
      res.status(201).json(player);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === 'Player number must be positive' ||
          error.message === 'Handedness must be LEFT or RIGHT')
      ) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create player' });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { name, number, handedness } = req.body;
      const updateData: any = {};
      if (name) updateData.name = name;
      if (number) updateData.number = parseInt(number);
      if (handedness) updateData.handedness = handedness;

      const player = await this.playerService.update(req.params.id, updateData);
      res.json(player);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === 'Player number must be positive' ||
          error.message === 'Handedness must be LEFT or RIGHT')
      ) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update player' });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      await this.playerService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete player' });
    }
  };
}
